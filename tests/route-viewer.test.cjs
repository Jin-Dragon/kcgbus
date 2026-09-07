const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadApp } = require('./simulation-harness.cjs');

async function viewer() {
  const elements = new Map();
  class Element {
    constructor(attributes = {}) { this.attributes = attributes; this.checked = true; this.style = {}; this.listeners = {}; this.classList = { toggle() {} }; }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    getAttribute(name) { return this.attributes[name]; }
    appendChild() {}
    closest() { return null; }
    fire(type) { for (const fn of this.listeners[type] || []) fn({ target: this, stopPropagation() {} }); }
  }
  const element = (selector, attributes) => {
    if (!elements.has(selector)) elements.set(selector, new Element(attributes));
    return elements.get(selector);
  };
  const selectors = {};
  for (const attribute of ['data-section-card', 'data-section-toggle', 'data-focus-section']) {
    selectors[`[${attribute}]`] = [0, 1].map(index => element(`[${attribute}="${index}"]`, { [attribute]: String(index) }));
  }
  selectors['[data-section-view]'] = [0, 1].flatMap(index => ['original', 'analysis'].map(view => element(
    `[data-section-view="${view}"][data-section-view-index="${index}"]`, { 'data-section-view': view, 'data-section-view-index': String(index) }
  )));
  class LatLng { constructor(lat, lng) { this.lat = lat; this.lng = lng; } }
  class Bounds {
    constructor() { this.points = []; }
    extend(point) { this.points.push(point); }
    isEmpty() { return !this.points.length; }
  }
  class MapObject {
    constructor(options) { this.options = options; this.map = options.map || null; }
    setMap(map) { this.map = map; }
    getMap() { return this.map; }
    setOptions(options) { Object.assign(this.options, options); }
  }
  class FakeMap {
    constructor() { this.fitted = null; }
    getBounds() { throw new Error('must not reuse viewport bounds'); }
    setBounds(bounds) { this.fitted = bounds; }
  }
  const coordinates = [0, 1, 2].map(index => ({lat:37.55 + index * .001, lng:127}));
  const sections = [0, 1].map(index => ({
    sectionIndex: index + 1, originalCoordinates: coordinates.slice(index, index + 2),
    originalCoordinateGroups: [coordinates.slice(index, index + 2)], analysisCoordinates: coordinates.slice(index, index + 2),
    stops: coordinates.slice(index, index + 2).map((point, i) => ({ ...point, name: `stop${index + i}` })),
    originalDistanceMeters: 111, analysisDistanceMeters: 111, analysisDriveSeconds: 30, totalSeconds: 56,
  }));
  const payload = { sections, originalPath: coordinates, analysisPath: coordinates, routeName: 'test' };
  const app = loadApp({ config: { appKey:'test' }, getRouteTimeSimulationMapWindowPayload: () => payload });
  const html = app.buildRouteTimeSimulationMapWindowHtml('test', 'test', { researchProfile: {pathMode:'drawn'}, departureTime:'202609080700' });
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const document = {
    getElementById: id => element(`#${id}`),
    querySelector: selector => element(selector),
    querySelectorAll: selector => selectors[selector] || [],
    createElement: () => new Element(),
    head: { appendChild(script) { script.onload(); } },
  };
  const context = vm.createContext({ document, console, setTimeout, window: {
    addEventListener() {}, setTimeout,
    kakao: {maps: { LatLng, LatLngBounds: Bounds, Map: FakeMap, Polyline: MapObject, CustomOverlay: MapObject,
      event: {addListener() {}}, load(callback) { callback(); } }},
  }});
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return {
    context, payload,
    run: code => vm.runInContext(code, context),
    toggle(id, checked) { const target = element(`#${id}`); target.checked = checked; target.fire('change'); },
    section(index, checked) { const target = selectors['[data-section-toggle]'][index]; target.checked = checked; target.fire('change'); },
    click(selector) { element(selector).fire('click'); },
    checked: id => element(`#${id}`).checked,
  };
}

test('all 32 source/master/section checkbox combinations match actual map objects', async () => {
  const v = await viewer();
  for (let mask = 0; mask < 32; mask++) {
    const [original, analysis, master, first, second] = [0,1,2,3,4].map(bit => Boolean(mask & (1 << bit)));
    v.section(0, first); v.section(1, second);
    v.toggle('toggle-sections', master);
    v.toggle('toggle-original-path', original); v.toggle('toggle-analysis-path', analysis);
    assert.equal(v.run('!!originalPolyline.getMap()'), original && !master);
    assert.equal(v.run('!!analysisPolyline.getMap()'), analysis && !master);
    for (let i = 0; i < 2; i++) {
      const selected = [first, second][i];
      assert.equal(v.run(`!!originalSectionPolylines[${i}][0].getMap()`), original && master && selected);
      assert.equal(v.run(`!!analysisSectionPolylines[${i}][0].getMap()`), analysis && master && selected);
      assert.equal(v.run(`!!stopMarkers[${i}][0].getMap()`), (original || analysis) && master && selected);
      assert.equal(v.run(`!!sectionLabels[${i}].getMap()`), (original || analysis) && master && selected);
    }
  }
});

test('checking a second section leaves single-section focus and displays both selections', async () => {
  const v = await viewer();
  v.run('focusSection(0)');
  assert.equal(v.run('!!analysisSectionPolylines[1][0].getMap()'), false);
  v.section(1, true);
  assert.equal(v.run('activeSectionIndex'), -1);
  assert.equal(v.run('!!analysisSectionPolylines[1][0].getMap()'), true);
});

test('focus enables an unchecked target; source changes exit original-only view', async () => {
  const v = await viewer();
  v.section(1, false); v.toggle('toggle-sections', false);
  v.run('focusSection(1, "original")');
  assert.equal(v.run('sectionVisible[1]'), true);
  assert.equal(v.checked('toggle-sections'), true);
  assert.equal(v.run('!!analysisSectionPolylines[1][0].getMap()'), false);
  v.toggle('toggle-analysis-path', true);
  assert.equal(v.run('!!analysisSectionPolylines[1][0].getMap()'), true);
  v.click('#show-selected-sections');
  assert.equal(v.run('activeSectionIndex'), -1);
});

test('refresh and late rendering preserve disabled source layers', async () => {
  const v = await viewer();
  v.toggle('toggle-original-path', false);
  v.toggle('toggle-analysis-path', false);
  v.run('refreshPayload(payload)');
  assert.equal(v.run('!!originalPolyline.getMap() || !!analysisPolyline.getMap()'), false);
  assert.equal(v.run('stopMarkers.flat().some(item => item.getMap())'), false);
  v.toggle('toggle-analysis-path', true);
  assert.equal(v.run('!!analysisSectionPolylines[0][0].getMap()'), true);
});

test('initial bounds and focused bounds only contain route geometry', async () => {
  const v = await viewer();
  assert.ok(v.run('map.fitted.points.every(point => point.lat >= 37.55 && point.lat <= 37.552)'));
  v.run('focusSection(0)');
  assert.ok(v.run('map.fitted.points.every(point => point.lat <= 37.551)'));
});

test('north and east arrows point in screen-correct directions and obey layer visibility', async () => {
  const v = await viewer();
  const north = v.run('buildDirectionArrowOverlays(Array.from({length:13}, (_,i) => ({lat:37+i*.001,lng:127})))');
  const east = v.run('buildDirectionArrowOverlays(Array.from({length:13}, (_,i) => ({lat:37,lng:127+i*.001})))');
  assert.ok(north[0].options.content.includes('rotate(0deg)'));
  assert.ok(east[0].options.content.includes('rotate(90deg)'));
  v.run('analysisDirectionOverlays[0] = buildDirectionArrowOverlays(Array.from({length:13}, (_,i) => ({lat:37+i*.001,lng:127}))); applySectionState()');
  assert.equal(v.run('!!analysisDirectionOverlays[0][0].getMap()'), true);
  v.toggle('toggle-analysis-path', false);
  assert.equal(v.run('!!analysisDirectionOverlays[0][0].getMap()'), false);
});
