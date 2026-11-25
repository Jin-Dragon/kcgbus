const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { gunzipSync } = require("node:zlib");

const SOURCE = "http://openapi.seoul.go.kr:8088";
const PAGE_SIZE = 1000;
const PAGE_CONCURRENCY = 4;
const REFRESH_INTERVAL = 6 * 60 * 60 * 1000;
const RADII = [100, 300, 500];

function seoulMonth(offset = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const { year, month, day } = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
  const lastPublished = new Date(Date.UTC(year, month - (day < 5 ? 3 : 2) - offset, 1));
  return lastPublished.toISOString().slice(0, 7).replace("-", "");
}

function dateCount(month) {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(4, 6)), 0)).getUTCDate();
}

function stationId(value) {
  return String(value ?? "").trim();
}

function hourlyColumns(row) {
  const columns = Object.keys(row).filter((column) => /^HR_(?:[0-9]|1[0-9]|2[0-3])_GET_(?:ON|OFF)_(?:TNOPE|NOPE)$/.test(column));
  const on = columns.filter((column) => column.includes("_GET_ON_"));
  const off = columns.filter((column) => column.includes("_GET_OFF_"));
  const hours = (items) => new Set(items.map((column) => column.split("_")[1])).size;
  if (on.length !== 24 || off.length !== 24 || hours(on) !== 24 || hours(off) !== 24) {
    throw new Error("서울시 승하차 응답의 시간대별 항목을 읽을 수 없습니다.");
  }
  return { on, off };
}

function addRidershipRow(totals, row, columns) {
  const id = stationId(row.STOPS_ID);
  if (!id) return;
  const count = (field) => {
    const value = row[field];
    if ((typeof value !== "number" && !/^\d+$/.test(String(value))) || !Number.isSafeInteger(Number(value)) || Number(value) < 0) {
      throw new Error("서울시 승하차 응답에 유효하지 않은 집계값이 있습니다.");
    }
    return Number(value);
  };
  const previous = totals.get(id) || { boarding: 0, alighting: 0 };
  previous.boarding += columns.on.reduce((sum, field) => sum + count(field), 0);
  previous.alighting += columns.off.reduce((sum, field) => sum + count(field), 0);
  totals.set(id, previous);
}

function addStationRow(stations, row) {
  const id = stationId(row.CRTR_ID);
  const lat = Number(row.LAT);
  const lng = Number(row.LOT);
  if (!id || stations.has(id) || !Number.isFinite(lat) || !Number.isFinite(lng)
      || lat < 33 || lat > 39 || lng < 124 || lng > 132) return;
  stations.set(id, {
    id, lat, lng,
    name: String(row.CRTR_NM ?? "").trim(),
    arsNo: String(row.CRTR_NO ?? "").trim(),
  });
}

function distanceMeters(lat, lng, station) {
  const toRadians = Math.PI / 180;
  const halfLat = (station.lat - lat) * toRadians / 2;
  const halfLng = (station.lng - lng) * toRadians / 2;
  const a = Math.sin(halfLat) ** 2 + Math.cos(lat * toRadians) * Math.cos(station.lat * toRadians) * Math.sin(halfLng) ** 2;
  return 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

function nearbySummary(snapshot, lat, lng, radius) {
  let nearbyStops = 0;
  let boardingTotal = 0;
  let alightingTotal = 0;
  const days = dateCount(snapshot.month);
  const stations = [];
  const latitudeMargin = radius / 110000;
  for (const stop of snapshot.stops) {
    if (Math.abs(stop.lat - lat) > latitudeMargin) continue;
    const distance = distanceMeters(lat, lng, stop);
    if (distance > radius) continue;
    nearbyStops += 1;
    if (stop.boarding == null || stop.alighting == null) continue;
    boardingTotal += stop.boarding;
    alightingTotal += stop.alighting;
    stations.push({
      id: stop.id,
      name: stop.name || "",
      arsNo: stop.arsNo || "",
      lat: stop.lat,
      lng: stop.lng,
      distanceMeters: distance,
      boardingPerDay: stop.boarding / days,
      alightingPerDay: stop.alighting / days,
    });
  }
  stations.sort((a, b) => a.distanceMeters - b.distanceMeters || String(a.id).localeCompare(String(b.id)));
  const matchedStops = stations.length;
  return {
    month: snapshot.month,
    days,
    radius,
    nearbyStops,
    matchedStops,
    boardingPerDay: matchedStops ? boardingTotal / days : null,
    alightingPerDay: matchedStops ? alightingTotal / days : null,
    stations,
  };
}

function parseNearbyQuery(params) {
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const radius = Number(params.get("radius") || 300);
  if (!params.get("lat")?.trim() || !params.get("lng")?.trim()
      || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180
      || !RADII.includes(radius)) return null;
  return { lat, lng, radius };
}

async function readSnapshot(filename, decode = (data) => data) {
  if (!filename) return null;
  try {
    const stored = JSON.parse(decode(await fs.readFile(filename)).toString("utf8"));
    if (/^20\d{2}(?:0[1-9]|1[0-2])$/.test(stored?.month) && Array.isArray(stored.stops) && stored.stops.length) {
      return stored;
    }
  } catch {
    // A missing or unreadable snapshot can be replaced by the other source.
  }
  return null;
}

function createSeoulStopRidership({
  apiKey = process.env.SEOUL_OPEN_DATA_API_KEY,
  directory = process.env.SEOUL_RIDERSHIP_CACHE_DIR || path.join(
    process.env.LOCALAPPDATA || os.homedir(), "WonderLinx", "seoul-ridership"
  ),
  fallbackPath = path.join(__dirname, "data", "seoul-stop-ridership-fallback.json.gz"),
  request = fetch,
} = {}) {
  const cachePath = path.join(directory, "monthly-stops-v1.json");
  let snapshot;
  let pending;
  let retryAfter = 0;

  async function page(service, parameter, first, last) {
    const suffix = parameter ? `/${encodeURIComponent(parameter)}` : "";
    const url = `${SOURCE}/${encodeURIComponent(apiKey)}/json/${service}/${first}/${last}${suffix}/`;
    let response;
    let json;
    try {
      response = await request(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error();
      json = await response.json();
    } catch {
      throw new Error("서울시 교통카드 자료 서버에 연결할 수 없습니다.");
    }
    const body = json?.[service];
    const code = body?.RESULT?.CODE || json?.RESULT?.CODE;
    if (code === "INFO-200") return { total: 0, rows: [] };
    if (code !== "INFO-000" || !Array.isArray(body?.row)
        || !Number.isSafeInteger(Number(body.list_total_count))) {
      throw new Error("서울시 교통카드 자료를 조회할 수 없습니다. 서버의 API 설정을 확인하세요.");
    }
    return { total: Number(body.list_total_count), rows: body.row };
  }

  async function eachRow(service, parameter, consumeRows) {
    const first = await page(service, parameter, 1, PAGE_SIZE);
    if (first.total > 150000) throw new Error("서울시 자료의 예상 조회 건수를 초과했습니다.");
    const checkPage = (batch, expected) => {
      if (batch.total !== first.total || batch.rows.length !== expected) {
        throw new Error("서울시 자료가 갱신 중입니다. 잠시 뒤 다시 조회하세요.");
      }
      consumeRows(batch.rows);
    };
    checkPage(first, Math.min(first.total, PAGE_SIZE));
    for (let start = PAGE_SIZE + 1; start <= first.total; start += PAGE_SIZE * PAGE_CONCURRENCY) {
      const batch = [];
      for (let index = 0; index < PAGE_CONCURRENCY; index += 1) {
        const firstIndex = start + index * PAGE_SIZE;
        if (firstIndex > first.total) break;
        const lastIndex = Math.min(firstIndex + PAGE_SIZE - 1, first.total);
        batch.push(page(service, parameter, firstIndex, lastIndex).then((data) => checkPage(data, lastIndex - firstIndex + 1)));
      }
      await Promise.all(batch);
    }
    return first.total;
  }

  async function loadStations() {
    const stations = new Map();
    await eachRow("tbisMasterStation", "", (rows) => rows.forEach((row) => addStationRow(stations, row)));
    return stations;
  }

  async function refresh(now) {
    const totals = new Map();
    let selectedMonth;
    let columns;
    for (let offset = 0; offset < 3; offset += 1) {
      selectedMonth = seoulMonth(offset, now);
      const total = await eachRow("CardBusTimeNew", selectedMonth, (rows) => {
        if (rows.length && !columns) columns = hourlyColumns(rows[0]);
        for (const row of rows) {
          if (String(row.USE_YM) !== selectedMonth) {
            throw new Error("조회 월과 서울시 승하차 자료의 기준월이 일치하지 않습니다.");
          }
          addRidershipRow(totals, row, columns);
        }
      });
      if (total) break;
    }
    if (!totals.size) throw new Error("서울시에서 공개한 월별 승하차 자료를 찾을 수 없습니다.");
    const stations = await loadStations();
    const stops = [...stations.values()].map((station) => ({ ...station, ...totals.get(station.id) }));
    if (!stops.some((stop) => stop.boarding != null)) {
      throw new Error("승하차 자료와 연결되는 서울시 정류장 좌표가 없습니다.");
    }
    return { schemaVersion: 2, month: selectedMonth, stops };
  }

  async function addCachedStationNames(previous) {
    const stations = await loadStations();
    if (!stations.size) throw new Error("서울시 정류장 이름 자료를 찾을 수 없습니다.");
    const stops = previous.stops.map((stop) => {
      const station = stations.get(stop.id);
      return station ? { ...stop, name: station.name, arsNo: station.arsNo } : stop;
    });
    return { ...previous, schemaVersion: 2, stops };
  }

  async function getOrRefresh() {
    if (!snapshot) {
      const [cached, bundled] = await Promise.all([
        readSnapshot(cachePath),
        readSnapshot(fallbackPath, gunzipSync),
      ]);
      snapshot = [cached, bundled].filter(Boolean).sort((a, b) =>
        b.month.localeCompare(a.month) || (b.schemaVersion || 1) - (a.schemaVersion || 1)
      )[0];
    }
    const now = new Date();
    const month = seoulMonth(0, now);
    if ((snapshot && snapshot.month >= month && snapshot.schemaVersion === 2)
        || (snapshot && (!apiKey || now.getTime() < retryAfter))) return snapshot;
    if (!apiKey) throw new Error("서울시 승하차 자료가 준비되지 않았습니다.");
    if (now.getTime() < retryAfter) throw new Error("서울시 승하차 자료를 다시 조회하고 있습니다. 잠시 뒤 확인하세요.");

    let next;
    try {
      next = snapshot?.month === month ? await addCachedStationNames(snapshot) : await refresh(now);
    } catch (error) {
      retryAfter = now.getTime() + (snapshot ? REFRESH_INTERVAL : 60000);
      if (snapshot) return snapshot;
      throw error;
    }
    retryAfter = next.month === month ? 0 : now.getTime() + REFRESH_INTERVAL;
    if (snapshot && next.month < snapshot.month) return snapshot;
    snapshot = next;
    try {
      await fs.mkdir(directory, { recursive: true });
      const temporaryPath = `${cachePath}.${process.pid}.tmp`;
      await fs.writeFile(temporaryPath, JSON.stringify(next));
      await fs.rename(temporaryPath, cachePath);
    } catch {
      // The current server can still use the in-memory snapshot.
    }
    return snapshot;
  }

  function getSnapshot() {
    if (!pending) {
      pending = getOrRefresh().finally(() => { pending = null; });
    }
    return pending;
  }

  return {
    getSnapshot,
    async nearby({ lat, lng, radius }) {
      return nearbySummary(await getSnapshot(), lat, lng, radius);
    },
  };
}

module.exports = { createSeoulStopRidership, nearbySummary, parseNearbyQuery, seoulMonth };
