const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
  createSeoulStopRidership, nearbySummary, parseNearbyQuery, seoulMonth,
} = require("../seoul-stop-ridership");

test("monthly publication follows the fifth day in Korea time", () => {
  assert.equal(seoulMonth(0, new Date("2026-01-04T14:59:59Z")), "202511");
  assert.equal(seoulMonth(0, new Date("2026-01-04T15:00:00Z")), "202512");
});

test("the radius filters by station coordinates and preserves missing and zero counts", () => {
  const snapshot = {
    month: "202402",
    stops: [
      { id: "B", lat: 37.55, lng: 127.051, boarding: 0, alighting: 0 },
      { id: "A", lat: 37.55, lng: 127.05, name: "정류장 A", arsNo: "00123", boarding: 87, alighting: 29 },
      { id: "C", lat: 37.55, lng: 127.0515 },
      { id: "D", lat: 37.55, lng: 127.055, boarding: 3000, alighting: 2000 },
    ],
  };
  const { stations, ...summary } = nearbySummary(snapshot, 37.55, 127.05, 300);
  assert.deepEqual(summary, {
    month: "202402", days: 29, radius: 300, nearbyStops: 3, matchedStops: 2,
    boardingPerDay: 3, alightingPerDay: 1,
  });
  assert.deepEqual(stations.map((station) => station.id), ["A", "B"]);
  assert.deepEqual(stations[0], {
    id: "A", name: "정류장 A", arsNo: "00123", lat: 37.55, lng: 127.05,
    distanceMeters: 0, boardingPerDay: 3, alightingPerDay: 1,
  });
  assert.equal(stations[1].boardingPerDay, 0);
  const outside = nearbySummary(snapshot, 36, 127, 500);
  assert.equal(outside.boardingPerDay, null);
  assert.deepEqual(outside.stations, []);
  assert.equal(parseNearbyQuery(new URLSearchParams("lat=&lng=127&radius=300")), null);
  assert.equal(parseNearbyQuery(new URLSearchParams("lat=37&lng=127&radius=200")), null);
});

test("monthly rows aggregate by official stop ID and concurrent reads share the cache", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wonderlinx-stop-ridership-test-"));
  t.after(async () => {
    await fs.unlink(path.join(directory, "monthly-stops-v1.json")).catch(() => {});
    await fs.rmdir(directory);
  });
  const month = seoulMonth();
  const serviceCalls = [];
  const ridershipRow = (boarding, alighting) => {
    const fields = Array.from({ length: 24 }, (_, hour) => {
      const suffix = hour === 1 ? "NOPE" : "TNOPE";
      return [[`HR_${hour}_GET_ON_${suffix}`, boarding], [`HR_${hour}_GET_OFF_${suffix}`, alighting]];
    }).flat();
    return { USE_YM: month, STOPS_ID: "000100001", ...Object.fromEntries(fields) };
  };
  const request = async (url) => {
    const service = new URL(url).pathname.split("/")[3];
    serviceCalls.push(service);
    const station = { CRTR_ID: "000100001", CRTR_NM: " 정류장 A ", CRTR_NO: "00123", LAT: 37.55, LOT: 127.05 };
    const rows = service === "tbisMasterStation" ? [station, station, { ...station, CRTR_ID: "000100002" }]
      : [ridershipRow(2, 1), ridershipRow(3, 4)];
    return {
      ok: true,
      json: async () => ({ [service]: { list_total_count: rows.length, RESULT: { CODE: "INFO-000" }, row: rows } }),
    };
  };
  const client = createSeoulStopRidership({ directory, fallbackPath: null, apiKey: "test-key", request });
  const [snapshot, result] = await Promise.all([
    client.getSnapshot(),
    client.nearby({ lat: 37.55, lng: 127.05, radius: 100 }),
  ]);
  assert.deepEqual(serviceCalls, ["CardBusTimeNew", "tbisMasterStation"]);
  assert.equal(snapshot.stops.length, 2);
  assert.equal(result.matchedStops, 1);
  assert.equal(result.stations[0].name, "정류장 A");
  assert.equal(result.stations[0].arsNo, "00123");
  assert.equal(result.boardingPerDay, 120 / result.days);
  assert.equal(result.alightingPerDay, 120 / result.days);
  const offline = createSeoulStopRidership({ directory, fallbackPath: null, apiKey: "", request: () => assert.fail("unexpected HTTP request") });
  assert.deepEqual(await offline.getSnapshot(), snapshot);

  const legacy = {
    month,
    stops: snapshot.stops.map(({ name, arsNo, ...stop }) => stop),
  };
  await fs.writeFile(path.join(directory, "monthly-stops-v1.json"), JSON.stringify(legacy));
  serviceCalls.length = 0;
  const upgraded = createSeoulStopRidership({ directory, fallbackPath: null, apiKey: "test-key", request });
  assert.deepEqual(await upgraded.getSnapshot(), snapshot);
  assert.deepEqual(serviceCalls, ["tbisMasterStation"]);
});

test("deployed instance can return named stations without a local cache or API key", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wonderlinx-stop-ridership-fallback-"));
  t.after(() => fs.rmdir(directory));
  const client = createSeoulStopRidership({ directory, apiKey: "", request: () => assert.fail("unexpected HTTP request") });
  const summary = await client.nearby({ lat: 37.57287, lng: 127.0703, radius: 300 });
  assert.equal(summary.month, "202610");
  assert.equal(summary.matchedStops, 10);
  assert.equal(summary.stations[0].name, "장안사거리");
  assert.equal(summary.stations[0].arsNo, "06234");
  assert.equal(summary.stations[0].boardingPerDay, 25945 / 31);
});
