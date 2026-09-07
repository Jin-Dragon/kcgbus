const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadApp, readRoutes } = require('./simulation-harness.cjs');
const app = loadApp();
const point = (x, y, name = '') => ({ lat: 37 + y / 111195, lng: 127 + x / (111195 * Math.cos(37 * Math.PI / 180)), name });
const distance = groups => groups.reduce((sum, group) => sum + app.measureCoordinatePathDistance(group), 0);
const close = (actual, expected, tolerance = 1) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

function contextFor(route) {
  return loadApp({
    config: { appKey: 'test-only' },
    getPointsInRoute: () => route.points,
    getPathsInRoute: () => route.paths,
    getOperationalPointsInRoute: () => route.points.filter(stop => !stop.isVirtual),
  });
}

function verifyRoute(route) {
  const a = contextFor(route);
  const options = { pathMode: 'drawn', busDelayPercent: 9, selectedDate: '2026-09-08' };
  const prepared = a.buildRouteTimeSimulationSegments(route.name, options);
  const response = a.buildDrawnRouteTimeSimulationResponse([prepared], [{ label: '07:00', departureTime: '202609080700' }], options);
  const report = a.buildRouteTimeSimulationReport(response, options);
  const row = report.rows[0];
  a.latestRouteTimeSimulationReport = report;
  const payload = a.getRouteTimeSimulationMapWindowPayload(report.id, route.name, row.departureTime);
  assert.equal(row.stopTimeline.length, route.points.filter(stop => !stop.isVirtual).length - 1);
  assert.equal(row.stopTimeline.at(-1).elapsedSeconds, row.totalSeconds);
  assert.equal(row.chunkTimeProfiles.reduce((sum, chunk) => sum + chunk.totalSeconds, 0), row.totalSeconds);
  close(row.distanceMeters, distance(prepared.drawnPathMatch.groups), 1);
  close(a.measureCoordinatePathDistance(payload.analysisPath), row.distanceMeters, 1);
  for (let index = 0; index < row.chunks.length; index++) {
    const chunk = row.chunks[index];
    const section = payload.sections[index];
    close(section.originalDistanceMeters, chunk.distanceMeters);
    close(a.measureCoordinatePathDistance(section.analysisCoordinates), chunk.distanceMeters);
    close(chunk.coordinateGroups.reduce((sum, group) => sum + a.measureCoordinatePathDistance(group), 0), chunk.distanceMeters);
    if (index) {
      const previous = row.chunks[index - 1];
      close(a.distanceInMeters(previous.coordinates.at(-1), chunk.coordinates[0]), 0, 0.01);
      close(previous.stops.at(-1).snappedLat, chunk.stops[0].snappedLat, 1e-10);
    }
  }
  const matches = prepared.drawnPathMatch.matches;
  matches.slice(1).forEach((match, index) => assert.ok(match.measure >= matches[index].measure - 0.001));
  const rawDrive = row.chunks.reduce((sum, chunk) => sum + chunk.driveSeconds, 0);
  assert.equal(row.totalSeconds, rawDrive + Math.round(rawDrive * 0.09) + row.dwellSecondsTotal);
  const html = a.buildRouteTimeSimulationMapWindowHtml(report.id, route.name, row);
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
  const workbook = a.buildRouteTimeSimulationExcelWorkbook(report);
  assert.ok(workbook.includes('path_warnings'));
  row.pathWarnings.forEach(warning => {
    assert.ok(html.includes(a.escapeHtml(warning)));
    assert.ok(workbook.includes(a.escapeSpreadsheetXml(warning)));
  });
  return { row, prepared, payload };
}

test('sparse vertices: two stops on the same long segment use their projections', () => {
  const result = app.matchDrawnRoutePath([point(0, 0), point(2000, 0)], [point(500, 2), point(800, 2)]);
  close(distance(result.groups), 300);
  close(result.matches[0].distanceMeters, 2);
});

test('outbound and return occurrences follow the full itinerary across chunk boundaries', () => {
  const path = [point(0, 0), point(2000, 0), point(2000, 500), point(0, 500), point(0, 10), point(2000, 10)];
  const points = [point(0, 0), point(500, 0), point(1000, 6), point(1500, 0), point(2000, 0), point(2000, 500), point(0, 500), point(0, 10), point(1000, 10), point(2000, 10)];
  const result = verifyRoute({ name: '반복 통과', points, paths: [{ coordinates: path }] });
  assert.equal(result.prepared.drawnPathMatch.matches[2].segmentIndex, 0);
  close(result.row.distanceMeters, app.measureCoordinatePathDistance(path));
});

test('reversed KML geometry preserves stop order and length', () => {
  const result = app.matchDrawnRoutePath([point(2000, 0), point(0, 0)], [point(200, 0), point(800, 0), point(1600, 0)]);
  close(distance(result.groups), 1400);
});

test('real loop is retained even when first and last stops coincide', () => {
  const path = [point(0, 0), point(2000, 0), point(2000, 2000), point(0, 2000), point(0, 0)];
  const result = app.matchDrawnRoutePath(path, [point(0, 0), point(0, 0)]);
  close(distance(result.groups), app.measureCoordinatePathDistance(path));
  assert.ok(result.warnings.some(warning => warning.includes('순환 구간')));
});

test('closed line may start at a different location than the first stop', () => {
  const path = [point(0, 0), point(2000, 0), point(2000, 2000), point(0, 2000), point(0, 0)];
  const stops = [point(1000, 0), point(2000, 1000), point(1000, 2000), point(0, 1000), point(1000, 0)];
  close(distance(app.matchDrawnRoutePath(path, stops).groups), app.measureCoordinatePathDistance(path));
});

test('coincident distinct stops are kept and contribute dwell, not artificial driving distance', () => {
  const points = [point(0, 0, 'A'), point(500, 0, 'B'), point(500, 0, 'C'), point(1000, 0, 'D')];
  const { row } = verifyRoute({ name: '동일 좌표 정류장', points, paths: [{ coordinates: [point(0, 0), point(1000, 0)] }] });
  assert.equal(row.stopTimeline[1].driveSeconds, 0);
  assert.equal(row.dwellSecondsTotal, 78);
});

test('virtual waypoint preserves geometry without adding a dwell stop', () => {
  const points = [point(0, 0, 'A'), { ...point(300, 0, '가상'), isVirtual: true }, point(600, 0, 'B'), point(1000, 0, 'C')];
  verifyRoute({ name: '가상', points, paths: [{ coordinates: [point(0, 0), point(1000, 0)] }] });
});

test('far stops, incompatible order, and empty geometry fail explicitly', () => {
  assert.throws(() => app.matchDrawnRoutePath([point(0, 0), point(2000, 0)], [point(0, 0), point(1000, 500)]), /정류장/);
  assert.throws(() => app.matchDrawnRoutePath([point(0, 0), point(2000, 0)], [point(0, 0), point(1800, 0), point(300, 0), point(2000, 0)]), /순서/);
  assert.throws(() => app.matchDrawnRoutePath([point(0, 0), point(0, 0)], [point(0, 0), point(0, 0)]), /0m/);
});

test('separate paths do not silently create a straight connecting road', () => {
  const route = { name: '단절', points: [point(0, 0), point(3000, 0)], paths: [{coordinates: [point(0, 0), point(1000, 0)]}, {coordinates: [point(2000, 0), point(3000, 0)]}] };
  assert.throws(() => contextFor(route).buildRouteTimeSimulationSegments(route.name, { pathMode: 'drawn' }), /연결되지/);
});

test('large stop offset is reported instead of silently trusting its name', () => {
  const match = app.matchDrawnRoutePath([point(0, 0), point(2000, 0)], [point(0, 0), point(1000, 137), point(2000, 0)]);
  assert.ok(match.warnings.some(warning => warning.includes('137m')));
});

test('Kakao path mode keeps its separate routing and corrections workflow', () => {
  const route = { name: 'Kakao', points: [point(0, 0), point(1000, 500)], paths: [{ coordinates: [point(0, 0), point(1000, 0)] }] };
  const a = contextFor(route);
  let calls = 0;
  a.applyRouteSimulationCorrection = (_name, stops) => { calls++; return stops; };
  const result = a.buildRouteTimeSimulationSegments(route.name, {pathMode: 'kakao'});
  assert.equal(result.drawnPathMatch, null);
  assert.equal(calls, result.segmentCount);
});

if (process.env.SIMULATION_TEST_KML) {
  const routes = readRoutes(process.env.SIMULATION_TEST_KML);
  assert.equal(routes.length, 9);
  for (const route of routes) test(`actual KML: ${route.name}`, () => {
    const { row } = verifyRoute(route);
    const original = app.measureCoordinatePathDistance(route.paths.flatMap(path => path.coordinates));
    assert.ok(row.distanceMeters < original + 31, 'must not add repeated loops');
    assert.ok(row.distanceMeters > original * 0.9, 'must not remove most of an intended route');
    if (route.name === '1-1 노선') {
      close(row.chunks[1].distanceMeters, 1105.7);
      close(row.distanceMeters, 8564.3);
      close(app.measureCoordinatePathDistance(row.chunks[1].coordinateGroups[2]), 316, 3);
    }
    console.log(`${route.name}: ${original}m -> ${row.distanceMeters}m; ${row.totalSeconds}s; section2=${row.chunkTimeProfiles[1]?.totalSeconds}s; warnings=${row.pathWarnings.join(' / ')}`);
  });
}
