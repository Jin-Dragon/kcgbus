const test = require('node:test');
const assert = require('node:assert/strict');
const {loadApp} = require('./simulation-harness.cjs');

function workspace() {
  const uploadedPoints = [
    {id:'a1',routeName:'기존',name:'정류장 A',lat:37,lng:127,ridership:10,createdOrder:1},
    {id:'a2',routeName:'기존',name:'정류장 B',lat:37.01,lng:127,ridership:20,createdOrder:3},
    {id:'b1',routeName:'신규',name:'정류장 C',lat:37.02,lng:127,ridership:null,createdOrder:4},
    {id:'g1',routeName:'신규',name:'경로유도점 1',lat:37,lng:127,ridership:999,isVirtual:true,createdOrder:5},
    {id:'g2',routeName:'기존',name:'경로유도점 2',lat:37.005,lng:127,createdOrder:2,
      extendedData:[{name:'virtual',value:'true'}]},
  ].map(point=>({...point,fileName:'노선.kml',source:'uploaded'}));
  const paths=[{id:'p1',routeName:'기존',name:'경로',coordinates:[uploadedPoints[0],uploadedPoints[1]]}];
  const fileListEl={innerHTML:'',children:[],appendChild(item){this.children.push(item);}};
  const app=loadApp({
    DEFAULT_ROUTE_NAME:'기본 노선', OVERLAP_DISTANCE_THRESHOLD_METERS:20, AUTO_SAVE_FILENAME:'test.kml',
    uploadedPoints,customPoints:[],pointOverrides:{},
    fileCountEl:{innerHTML:''},pointCountEl:{innerHTML:''},fileListEl,
    document:{createElement:()=>({className:'',innerHTML:'',children:[],
      setAttribute(){},addEventListener(){},appendChild(item){this.children.push(item);}})},
    getRoutes:()=>['기존','신규'],getAllPaths:()=>paths,
    getRouteSetting:name=>({routeGroup:name==='신규'?'merged':'default'}),
    isRouteDeleted:()=>false,getExportObservationAreas:()=>[],
    buildRouteStyle:()=>'',routeStyleId:()=>'',buildRouteMetadataEntries:()=>[],
  });
  return {app,uploadedPoints,paths,fileListEl};
}

test('top stop counts and existing/new subtotals exclude guidance points', () => {
  const {app}=workspace();
  app.updateCounts();
  assert.equal(app.pointCountEl.innerHTML,'3<small>기존 2 / 신규 1</small>');
  assert.equal(app.fileCountEl.innerHTML,'2<small>기존 1 / 신규 1</small>');
  assert.equal(app.getAllPoints().length,5,'guidance points remain in the workspace');
});

test('adding, deleting and showing guidance points does not change stop totals', () => {
  const {app}=workspace();
  app.updateCounts();
  const before=app.pointCountEl.innerHTML;
  app.customPoints.push({id:'g3',routeName:'기존',name:'경로유도점 3',isVirtual:true,lat:37.006,lng:127});
  app.updateCounts();
  assert.equal(app.pointCountEl.innerHTML,before);
  app.customPoints=[];
  app.pointOverrides.g1={deleted:true};
  app.updateCounts();
  assert.equal(app.pointCountEl.innerHTML,before);
});

test('changing point type and deleting an operational stop updates the correct subtotal', () => {
  const {app}=workspace();
  app.pointOverrides.a1={isVirtual:true};
  app.updateCounts();
  assert.equal(app.pointCountEl.innerHTML,'2<small>기존 1 / 신규 1</small>');
  app.pointOverrides.a1={isVirtual:false};
  app.pointOverrides.b1={deleted:true};
  app.updateCounts();
  assert.equal(app.pointCountEl.innerHTML,'2<small>기존 2 / 신규 0</small>');
});

test('legacy imported file summaries are recalculated and label guidance separately', () => {
  const {app,fileListEl}=workspace();
  app.renderFileList([{name:'노선.kml',pointCount:5,pathCount:1,areaCount:0}]);
  assert.match(fileListEl.children[0].children[0].innerHTML,/3개 정류장 \/ 경로유도점 2개/);
  app.pointOverrides.g1={deleted:true};
  app.renderFileList([{name:'노선.kml',pointCount:5,pathCount:1,areaCount:0}]);
  assert.match(fileListEl.children.at(-1).children[0].innerHTML,/3개 정류장 \/ 경로유도점 1개/);
});

test('stop analysis excludes guidance but preserves complete path geometry and route scope', () => {
  const {app,paths}=workspace();
  const data=app.buildAnalysisDataset(['기존']);
  assert.equal(data.routes.length,1);
  assert.equal(data.routes[0].points.map(p=>p.id).join(','),'a1,a2');
  assert.equal(JSON.stringify(data.routes[0].paths[0].coordinates),
    JSON.stringify(paths[0].coordinates.map(({lat,lng})=>({lat,lng}))));
  assert.equal(app.buildAnalysisDataset([]).routes.length,0);
});

test('nearby guidance points are not duplicate stop candidates', () => {
  const {app}=workspace();
  assert.equal(app.detectDuplicatePoints(30).length,0);
  app.uploadedPoints.push({id:'b2',routeName:'신규',name:'실제 중복 정류장',lat:37,lng:127});
  const duplicates=app.detectDuplicatePoints(30);
  assert.equal(duplicates.length,1);
  assert.equal(duplicates[0].points.map(p=>p.id).sort().join(','),'a1,b2');
});

test('ridership candidates and missing-input counts ignore guidance points', () => {
  const {app}=workspace();
  const report=app.buildRidershipCandidateAnalysis(['기존','신규']);
  assert.equal(report.analyzedPointCount,3);
  assert.equal(report.ridershipPointCount,2);
  assert.equal(report.missingRidershipCount,1);
  assert.ok(report.rankedCandidates.every(p=>p.id!=='g1'&&p.id!=='g2'));
  assert.equal(app.estimatePointPopulation(app.getPointById('a1')).nearbyStopCount,0);
});

test('ridership reports never treat a guidance point as a boarded stop', () => {
  const {app}=workspace();
  const report=app.buildRidershipAnalysisReport(['기존','신규']);
  assert.equal(report.summary.analyzedStopCount,2);
  assert.equal(report.routes.length,1);
  assert.equal(report.routes[0].totalRidership,30);
});

test('before/after metrics use operational stops only', () => {
  const {app}=workspace();
  const report=app.buildRouteGroupComparisonMetrics(['기존','신규'],2);
  assert.equal(report.pointCount,3);
  assert.equal(report.totalRidership,30);
  assert.equal(report.routeSummaries[0].pointCount,2);
  assert.equal(report.routeSummaries[1].pointCount,1);
});

test('guidance-only changes do not inflate coverage estimates', () => {
  const {app}=workspace();
  const before=app.calculateCoverageAreaSquareKm(['기존','신규']);
  app.customPoints.push({id:'remote-guide',routeName:'기존',isVirtual:true,lat:38,lng:128});
  assert.equal(app.calculateCoverageAreaSquareKm(['기존','신규']),before);
});

test('KML export retains guidance flags and coordinates despite excluding them from counts', () => {
  const {app}=workspace();
  const kml=app.buildCurrentKml();
  assert.equal((kml.match(/<Point>/g)||[]).length,5);
  assert.equal((kml.match(/<Data name="virtual"><value>true<\/value><\/Data>/g)||[]).length,2);
  assert.match(kml,/<name>경로유도점 2<\/name>/);
  assert.match(kml,/<coordinates>127,37.005<\/coordinates>/);
});

test('simulation snapping distinguishes operational stops from routing points', () => {
  const {app}=workspace();
  const route=app.buildRouteTimeSimulationSegments('기존',{pathMode:'drawn'});
  assert.equal(route.stopCount,2);
  assert.equal(route.snappedStopCount,2);
  assert.equal(route.snappedPointCount,3);
});

test('simulation logs list guidance and correction points without counting them as stops', () => {
  const {app}=workspace();
  const log=app.buildRouteTimeSimulationLogText({stopCount:2,chunks:[{stops:[
    {name:'A'},{name:'경로유도점 1',isVirtual:true},
    {name:'강제포인트',isVirtual:true,isSimulationCorrection:true},{name:'B'},
  ]}]});
  assert.match(log,/- 포함 정류장: 2개/);
  assert.match(log,/- 포함 경로유도점: 1개/);
  assert.match(log,/경로유도점 1/);
});
