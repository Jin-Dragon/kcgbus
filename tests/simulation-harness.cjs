const fs = require('node:fs');
const vm = require('node:vm');

function loadApp(overrides = {}) {
  const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const functions = source.match(/^  function \w+\([^\n]*\) \{[\s\S]*?^  \}/gm) || [];
  const context = vm.createContext({ console, ...overrides });
  const constants = ['ROUTE_TIME_SIMULATION_CHUNK_STOP_COUNT', 'ROUTE_TIME_SIMULATION_BASE_STOP_COUNT',
    'ROUTE_TIME_SIMULATION_PATH_MODE_DRAWN', 'ROUTE_TIME_SIMULATION_PATH_MODE_KAKAO', 'RESEARCH_BASE_DWELL_SECONDS', 'DEFAULT_BUS_DELAY_PERCENT']
    .map(name => source.match(new RegExp(`^  const ${name} = .*;`, 'm'))[0]);
  vm.runInContext(`
    ${constants.join('\n')}
    ${source.slice(source.indexOf('  const REGION_AVERAGE_SPEED_KMH'), source.indexOf('  const config ='))}
    ${functions.join('\n')}
  `, context);
  Object.assign(context, overrides);
  return context;
}

// Test-only reader for the exported route folders; production uses DOMParser.
function readRoutes(filename) {
  const xml = fs.readFileSync(filename, 'utf8');
  const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const coords = text => text.trim().split(/\s+/).map(value => {
    const [lng, lat] = value.split(',').map(Number);
    return { lat, lng };
  });
  return [...xml.matchAll(/<Folder>((?:(?!<Folder>)[\s\S])*?)<\/Folder>/g)].map(match => {
    const body = match[1];
    const name = decode(body.match(/<name>([\s\S]*?)<\/name>/)?.[1] || '');
    const points = [];
    const paths = [];
    for (const placemark of body.matchAll(/<Placemark[\s\S]*?<\/Placemark>/g)) {
      const block = placemark[0];
      const name = decode(block.match(/<name>([\s\S]*?)<\/name>/)?.[1] || '');
      const geometry = block.match(/<(Point|LineString)>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
      if (!geometry) continue;
      if (geometry[1] === 'Point') points.push({ name, ...coords(geometry[2])[0] });
      else paths.push({ coordinates: coords(geometry[2]) });
    }
    return { name, points, paths };
  }).filter(route => route.points.length && route.paths.length);
}

module.exports = { loadApp, readRoutes };

if (require.main === module) {
  const app = loadApp();
  for (const route of readRoutes(process.argv[2])) {
    const path = route.paths.flatMap(item => item.coordinates);
    let sum = 0;
    const chunks = [];
    let match;
    try { match = app.matchDrawnRoutePath(path, route.points); }
    catch (error) { console.log(route.name, error.message); continue; }
    route.points.forEach((point, index) => point.routeStopIndex = index);
    for (let i = 0; i < route.points.length - 1; i += 3) {
      const chunk = app.buildDrawnRouteSimulationChunk(route.points.slice(i, i + 4), chunks.length + 1, path, 13.9, match);
      chunks.push(chunk);
      sum += chunk.distanceMeters;
    }
    console.log(JSON.stringify({ route: route.name, original: app.measureCoordinatePathDistance(path), calculated: sum, chunks: chunks.map(chunk => chunk.distanceMeters), warnings: match.warnings,
      matches: route.name === '1-1 노선' ? match.matches.map((item, index) => ({stop: index + 1, segment: item.segmentIndex, fraction: +item.fraction.toFixed(3), measure: Math.round(item.measure), gap: Math.round(item.distanceMeters)})) : undefined }));
  }
}
