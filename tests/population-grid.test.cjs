const test = require("node:test");
const assert = require("node:assert/strict");
const zip = require("fflate");
const clipping = require("polygon-clipping");
const createGrid = require("../population-grid-data");

const square = (x, y, size = 100) => [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]];
const projection = { forward: (position) => position, inverse: (position) => position };
const point = (lng, lat) => ({ lng, lat });

function cell(id, x, value) {
  return { id, polygons: [square(x, 0)], bounds: [x, 0, x + 100, 100], area: 10000, value };
}

const dataset = {
  projection,
  bounds: [0, 0, 300, 100],
  cells: [cell("A", 0, 40), cell("B", 100, 60), cell("C", 200, null)],
};
const grid = createGrid(zip, null, null, clipping);

test("route accessibility unions overlapping stop buffers and distinguishes unknown grids", () => {
  const east = point(150, 50);
  const west = point(50, 50);
  const a = grid.summarizeCoverage(dataset, [west, east], 100);
  const b = grid.summarizeCoverage(dataset, [west, east, west, east], 100);
  assert.equal(a.covered, 100);
  assert.deepEqual(a, b);
  assert.equal(a.total, 100);
  assert.equal(a.unknownCells, 1);
  assert.equal(a.uncoveredCells, 0);
});

test("comparison counts only added service inside the observation area", () => {
  const area = [point(25, 0), point(150, 0), point(150, 100), point(25, 100)];
  const summary = grid.summarizeCoverage(dataset, [point(100, 50)], 100, area, [point(50, 50)]);
  assert.equal(summary.total, 60);
  assert.equal(summary.covered, 60);
  assert(summary.comparisonCovered > 50 && summary.comparisonCovered < 60);
  assert(Math.abs(summary.newlyCovered + summary.comparisonCovered - 60) < 0.0001);
  assert.deepEqual([...summary.newIds], ["B"]);
});

test("stop coverage weights partial grid overlap and reports unknown cells", () => {
  const result = grid.summarizeStop(dataset, point(100, 50), 50);
  assert.equal(result.publishedCells, 2);
  assert(result.covered > 39 && result.covered < 40);
  assert.equal(grid.summarizeStop(dataset, point(250, 50), 20).unknownCells, 1);
});

test("ZIP upload preserves numeric zero, N/A, and empty values as distinct states", () => {
  const records = [{ gid: "A", val: 0, lbl: "0" }, { gid: "B", val: 0, lbl: "N/A" }, { gid: "C", val: NaN, lbl: "" }];
  const shp = {
    parseDbf: () => records,
    parseShp: () => [0, 100, 200].map((x) => ({ type: "Polygon", coordinates: square(x, 0) })),
  };
  const proj4 = () => projection;
  proj4.Proj = function () { this.projName = "tmerc"; };
  const table = new Uint8Array(32);
  new DataView(table.buffer).setUint32(4, records.length, true);
  const input = zip.zipSync({ "grid.shp": new Uint8Array(100), "grid.dbf": table, "grid.prj": zip.strToU8("test") });
  const data = createGrid(zip, shp, proj4, clipping).readPopulationZip(input, "고령 인구 100M_동대문구_202604.zip");
  assert.equal(data.resolution, "100m");
  assert.equal(data.month, "2026년 4월");
  assert.deepEqual(data.counts, { published: 1, withheld: 1, missing: 1 });
  assert.deepEqual(data.cells.map((item) => item.value), [0, null, null]);
});
