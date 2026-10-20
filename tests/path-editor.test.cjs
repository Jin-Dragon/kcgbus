const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadApp } = require('./simulation-harness.cjs');

const plain = value => JSON.parse(JSON.stringify(value));

function editor(source = 'uploaded-path') {
  const classes = new Set();
  const button = () => ({
    textContent: '', disabled: false,
    classList: {
      remove: value => classes.delete(value),
      toggle: (value, active) => active ? classes.add(value) : classes.delete(value),
    },
  });
  class LatLng {
    constructor(lat, lng) { this.lat = lat; this.lng = lng; }
    getLat() { return this.lat; }
    getLng() { return this.lng; }
  }
  class MapObject {
    constructor(options) { this.options = options; this.listeners = {}; }
    setMap(map) { this.map = map; }
    getPosition() { return this.options.position; }
    fire(type, position) { this.listeners[type]?.({ latLng: position }); }
  }
  const saved = new Map();
  const statuses = [];
  const original = {
    id:'path-1', source, routeName:'테스트 노선', name:'테스트 경로', description:'유지할 설명',
    coordinates:Array.from({length:5}, (_,i)=>({lat:37.5+i*.001,lng:127+i*.001,altitude:0})),
  };
  let app;
  app = loadApp({
    DEFAULT_ROUTE_NAME:'기본 노선', CUSTOM_PATHS_KEY:'custom-paths', PATH_OVERRIDES_KEY:'path-overrides',
    selectedRouteName:original.routeName, selectedPathId:null, selectedPointId:null,
    drawPathMode:false, editPathMode:false, pathExtendMode:false, selectedPathVertexIndex:null,
    workingPathCoordinates:[], uploadedPaths:source==='uploaded-path' ? [plain(original)] : [],
    customPaths:source==='custom-path' ? [plain(original)] : [], pathOverrides:{},
    mapReady:true, map:{}, pathVertexMarkers:[], pathPreviewDirectionOverlays:[], pathPreviewPolyline:null,
    pathContextMenuOverlay:null, infoWindows:[], analysisInfoWindows:[], designedRouteInfoWindows:[],
    roadviewPlacementActive:false, observationAreaDrawMode:false, relocatePointId:null,
    startPathDrawButtonEl:button(), startPathEditButtonEl:button(), finishPathButtonEl:button(),
    cancelPathButtonEl:button(), deletePathButtonEl:button(), saveDesignedPathButtonEl:null,
    addPointButtonEl:button(), addGuidancePointButtonEl:null, resetPointButtonEl:button(),
    movePointButtonEl:button(), deletePointButtonEl:button(), pointFormEl:{elements:[]},
    pathEditorHelpEl:{textContent:''}, pathFormEls:{name:{value:''},description:{value:''}},
    analysisModalEl:{classList:{contains:()=>true}},
    window:{
      localStorage:{setItem:(key,value)=>saved.set(key,value)},
      kakao:{maps:{LatLng, Marker:MapObject, Polyline:MapObject,
        event:{addListener:(target,name,callback)=>target.listeners[name]=callback}}},
    },
    getPointById:()=>null, getRouteSetting:()=>({color:'#176c48'}), isRouteDeleted:()=>false,
    stopObservationAreaDrawMode:()=>{}, stopRelocateMode:()=>{}, renderPoints:()=>{},
    hidePointListContextMenu:()=>{}, createVertexMarkerImage:()=>null,
    scheduleAutoSaveKml:()=>{}, pushUndoSnapshot:()=>{},
    setStatus:(message,error)=>statuses.push({message,error}),
    fillPathForm:pathItem=>{
      app.pathFormEls.name.value=pathItem?.name || '';
      app.pathFormEls.description.value=pathItem?.description || '';
    },
    getSelectedPathRouteName:()=>app.selectedRouteName,
    refreshUI:()=>{ app.updatePathEditorUi(); app.syncPathPreview(); },
  });
  app.updatePathEditorUi();
  return {app,saved,statuses,original,LatLng};
}

test('visible toolbar edit button is wired to the edit/save action', () => {
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  assert.match(source,/startPathEditButtonEl\.addEventListener\("click", handlePathEditButtonClick\)/);
});

for (const source of ['uploaded-path','custom-path']) {
  test(`${source}: edit -> move/delete -> toolbar save persists current draft and exits`, () => {
    const {app,saved,original}=editor(source);
    assert.equal(app.startPathEditButtonEl.textContent,'경로 수정');
    app.handlePathEditButtonClick();
    assert.equal(app.editPathMode,true);
    assert.equal(app.startPathEditButtonEl.textContent,'경로 저장');
    app.workingPathCoordinates[1].lat+=.0002;
    app.deleteWorkingPathVertex(2);
    const edited=plain(app.workingPathCoordinates);
    assert.equal(edited.length,2);
    assert.deepEqual(plain(app.getPathById(original.id).coordinates),original.coordinates);
    assert.equal(saved.size,0,'draft must not be saved before the save click');
    app.handlePathEditButtonClick();
    assert.deepEqual(plain(app.getPathById(original.id).coordinates),edited);
    const key=source==='uploaded-path' ? 'path-overrides' : 'custom-paths';
    const persisted=JSON.parse(saved.get(key));
    const stored=source==='uploaded-path' ? persisted[original.id] : persisted[0];
    assert.deepEqual(stored.coordinates,edited);
    assert.equal(stored.rawCoordinates,edited.map(p=>`${p.lng},${p.lat},${p.altitude}`).join(' '));
    assert.equal(stored.description,original.description);
    assert.equal(app.editPathMode,false);
    assert.equal(app.pathVertexMarkers.length,0);
    assert.equal(app.startPathEditButtonEl.textContent,'경로 수정');
    app.handlePathEditButtonClick();
    assert.deepEqual(plain(app.workingPathCoordinates),edited,'reopening uses the saved geometry');
  });
}

test('dragged vertices remain draft edits until toolbar save', () => {
  const {app,saved,LatLng}=editor();
  app.handlePathEditButtonClick();
  app.pathVertexMarkers[1].fire('dragend',new LatLng(37.5014,127.0013));
  assert.equal(app.workingPathCoordinates[1].lat,37.5014);
  assert.equal(saved.size,0);
  app.handlePathEditButtonClick();
  assert.equal(app.getPathById('path-1').coordinates[1].lng,127.0013);
});

test('click-to-move keeps editing and does not save until the toolbar action', () => {
  const {app,saved,LatLng}=editor();
  app.handlePathEditButtonClick();
  app.selectedPathVertexIndex=2;
  app.handleMapClick({latLng:new LatLng(37.5024,127.0023)});
  assert.equal(app.editPathMode,true);
  assert.equal(app.selectedPathVertexIndex,null);
  assert.equal(saved.size,0);
  assert.equal(app.startPathEditButtonEl.textContent,'경로 저장');
  const draft=plain(app.workingPathCoordinates);
  app.handlePathEditButtonClick();
  assert.deepEqual(plain(app.getPathById('path-1').coordinates),draft);
});

test('finishing an extension keeps its draft pending for explicit save', () => {
  const {app,saved,LatLng}=editor();
  app.handlePathEditButtonClick();
  app.pathVertexMarkers.at(-1).fire('click');
  assert.equal(app.pathExtendMode,true);
  app.handleMapClick({latLng:new LatLng(37.505,127.005)});
  app.pathVertexMarkers.at(-1).fire('click');
  assert.equal(app.pathExtendMode,false);
  assert.equal(app.editPathMode,true);
  assert.equal(saved.size,0);
  app.handlePathEditButtonClick();
  assert.equal(app.getPathById('path-1').coordinates.length,6);
});

test('Escape discards draft changes and restores the edit button', () => {
  const {app,saved,original}=editor();
  app.handlePathEditButtonClick();
  app.workingPathCoordinates[1].lat+=.0002;
  app.handleKeydown({key:'Escape'});
  assert.equal(app.editPathMode,false);
  assert.equal(app.startPathEditButtonEl.textContent,'경로 수정');
  assert.equal(saved.size,0);
  assert.deepEqual(plain(app.getPathById('path-1').coordinates),original.coordinates);
});

test('failed validation keeps the draft and save button for correction', () => {
  const {app,saved,statuses}=editor();
  app.handlePathEditButtonClick();
  app.workingPathCoordinates=app.workingPathCoordinates.slice(0,1);
  app.handlePathEditButtonClick();
  assert.equal(app.editPathMode,true);
  assert.equal(app.startPathEditButtonEl.textContent,'경로 저장');
  assert.equal(saved.size,0);
  assert.equal(statuses.at(-1).error,true);
});

test('editing without a selected route does not enter save mode', () => {
  const {app,statuses}=editor();
  app.selectedRouteName=null;
  app.handlePathEditButtonClick();
  assert.equal(app.editPathMode,false);
  assert.equal(app.startPathEditButtonEl.textContent,'경로 수정');
  assert.equal(statuses.at(-1).error,true);
});
