(function (factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory;
  } else {
    window.WonderLinxPopulationGridData = factory(window.fflate, window.shp, window.proj4, window.polygonClipping);
  }
})(function (zip, shp, proj4, clipping) {
  const MAX_ZIP_BYTES = 15 * 1024 * 1024;
  const MAX_EXPANDED_BYTES = 64 * 1024 * 1024;
  const MAX_CELLS = 15000;
  const CIRCLE_VERTICES = 48;
  const EPSILON_AREA = 0.01;
  const DEFAULT_STYLES = [
    { min: 0, color: "#FFF5EB", opacity: 0.47 },
    { min: 36, color: "#FEE6CE", opacity: 0.47 },
    { min: 76, color: "#FDD0A2", opacity: 0.47 },
    { min: 120, color: "#FDAE6B", opacity: 0.47 },
    { min: 177, color: "#FD8D3C", opacity: 0.47 },
    { min: 255, color: "#F16913", opacity: 0.47 },
    { min: 405, color: "#CC4704", opacity: 0.47 },
  ];

  function ringArea(ring) {
    const [originX, originY] = ring[0];
    let twiceArea = 0;
    for (let index = 1; index < ring.length; index += 1) {
      const [x1, y1] = ring[index - 1];
      const [x2, y2] = ring[index];
      twiceArea += (x1 - originX) * (y2 - originY) - (x2 - originX) * (y1 - originY);
    }
    return Math.abs(twiceArea) / 2;
  }

  function geometryArea(multiPolygon) {
    return multiPolygon.reduce(
      (sum, [outer, ...holes]) => sum + ringArea(outer) - holes.reduce((area, ring) => area + ringArea(ring), 0),
      0
    );
  }

  function geometryBounds(multiPolygon) {
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    for (const polygon of multiPolygon) {
      for (const ring of polygon) {
        for (const [x, y] of ring) {
          bounds[0] = Math.min(bounds[0], x);
          bounds[1] = Math.min(bounds[1], y);
          bounds[2] = Math.max(bounds[2], x);
          bounds[3] = Math.max(bounds[3], y);
        }
      }
    }
    return bounds;
  }

  function mergeBounds(target, other) {
    return [
      Math.min(target[0], other[0]), Math.min(target[1], other[1]),
      Math.max(target[2], other[2]), Math.max(target[3], other[3]),
    ];
  }

  function intersectsBounds(left, right) {
    return left[0] <= right[2] && left[2] >= right[0] && left[1] <= right[3] && left[3] >= right[1];
  }

  function readPopulationZip(buffer, fileName) {
    if (!buffer.byteLength || buffer.byteLength > MAX_ZIP_BYTES) {
      throw new Error("15MB 이하의 국토통계지도 ZIP 파일을 선택하세요.");
    }
    let expandedBytes = 0;
    const files = zip.unzipSync(new Uint8Array(buffer), {
      filter({ name, originalSize }) {
        if (!/\.(shp|prj|dbf|cpg|cst)$/i.test(name)) return false;
        expandedBytes += originalSize;
        if (expandedBytes > MAX_EXPANDED_BYTES) {
          throw new Error("ZIP 안의 격자 데이터가 너무 큽니다. 시·군·구 단위 파일을 선택하세요.");
        }
        return true;
      },
    });
    const names = Object.keys(files);
    const shapes = names.filter((name) => /\.shp$/i.test(name));
    if (shapes.length !== 1) {
      throw new Error("ZIP 안에 격자 SHP 파일이 하나 있어야 합니다.");
    }
    const base = shapes[0].slice(0, -4).toLowerCase();
    const read = (ext) => files[names.find((name) => name.toLowerCase() === base + ext)];
    const shape = read(".shp");
    const dbf = read(".dbf");
    const prj = read(".prj");
    if (!dbf || !prj || shape.byteLength < 100 || dbf.byteLength < 32) {
      throw new Error("ZIP 안에 같은 이름의 SHP, DBF, PRJ 파일이 필요합니다.");
    }
    const count = new DataView(dbf.buffer, dbf.byteOffset, dbf.byteLength).getUint32(4, true);
    if (!count || count > MAX_CELLS) {
      throw new Error("격자가 1~15,000개인 시·군·구 파일을 선택하세요.");
    }
    const decoder = new TextDecoder();
    const coordinateSystem = decoder.decode(prj).trim();
    const sourceCrs = new proj4.Proj(coordinateSystem);
    const projection = proj4(sourceCrs, "EPSG:4326");
    if (sourceCrs.projName === "longlat" || sourceCrs.to_meter && sourceCrs.to_meter !== 1) {
      throw new Error("미터 단위 투영좌표계의 국토통계지도 ZIP이 필요합니다.");
    }
    const encoding = read(".cpg") || read(".cst");
    const attributes = shp.parseDbf(dbf, encoding ? decoder.decode(encoding).trim() : "utf-8");
    const geometries = shp.parseShp(shape);
    if (geometries.length !== count || attributes.length !== count || !("val" in attributes[0]) || !("gid" in attributes[0])) {
      throw new Error("SHP 격자와 DBF의 gid·val 값이 올바르게 연결되지 않습니다.");
    }

    const ids = new Set();
    const counts = { published: 0, withheld: 0, missing: 0 };
    let bounds = [Infinity, Infinity, -Infinity, -Infinity];
    const cells = geometries.map((geometry, index) => {
      const { gid, val, lbl } = attributes[index];
      const id = String(gid ?? "").trim();
      if (!id || ids.has(id) || !["Polygon", "MultiPolygon"].includes(geometry?.type)) {
        throw new Error("격자 ID가 비어 있거나 중복되어 있거나, 격자의 형식이 올바르지 않습니다.");
      }
      ids.add(id);
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      const cellBounds = geometryBounds(polygons);
      const area = geometryArea(polygons);
      if (!cellBounds.every(Number.isFinite) || !Number.isFinite(area) || area <= 0) {
        throw new Error("위치나 면적을 읽을 수 없는 격자가 있습니다.");
      }
      const label = String(lbl ?? "").replaceAll("\0", "").trim().toUpperCase();
      const state = label === "N/A" ? "withheld" : Number.isFinite(val) && val >= 0 ? "published" : "missing";
      const value = state === "published" ? val : null;
      counts[state] += 1;
      bounds = mergeBounds(bounds, cellBounds);
      return { id, polygons, bounds: cellBounds, area, state, value };
    });
    const [minX, minY, maxX, maxY] = bounds;
    const geodeticBounds = [projection.forward([minX, minY]), projection.forward([maxX, maxY])];
    if (!geodeticBounds.flat().every(Number.isFinite)) {
      throw new Error("격자의 좌표를 지도 위경도로 변환할 수 없습니다.");
    }
    const monthMatch = /(?:^|\D)(20\d{2})(0[1-9]|1[0-2])(?=\D|$)/.exec(fileName);
    const month = monthMatch ? `${monthMatch[1]}년 ${Number(monthMatch[2])}월` : "";
    const resolution = /(?:^|\D)(\d+)\s*M(?=$|[_\s.)-])/i.exec(fileName);
    return {
      fileName, month, counts, cells, bounds, projection,
      resolution: resolution ? `${Number(resolution[1])}m` : "",
      metric: fileName.includes("고령") ? "고령인구" : "인구",
    };
  }

  function pointToMeters(projection, { lng, lat }) {
    return projection.inverse([Number(lng), Number(lat)]);
  }

  function circle(point, radius) {
    const ring = Array.from({ length: CIRCLE_VERTICES }, (_, index) => {
      const angle = index * 2 * Math.PI / CIRCLE_VERTICES;
      return [point[0] + radius * Math.cos(angle), point[1] + radius * Math.sin(angle)];
    });
    ring.push(ring[0]);
    return [ring];
  }

  function catchment(dataset, stops, radius) {
    const uniqueCenters = new Map();
    for (const stop of stops) {
      const center = pointToMeters(dataset.projection, stop);
      const [x, y] = center;
      if (center.every(Number.isFinite) && intersectsBounds(dataset.bounds, [x - radius, y - radius, x + radius, y + radius])) {
        uniqueCenters.set(center.join(","), center);
      }
    }
    const circles = [...uniqueCenters.values()].map((center) => circle(center, radius));
    return circles.length ? clipping.union(...circles) : [];
  }

  function analysisScope(dataset, areaPoints) {
    if (areaPoints.length < 3) return null;
    const ring = areaPoints.map((point) => pointToMeters(dataset.projection, point));
    if (!ring.flat().every(Number.isFinite)) throw new Error("관찰 구역의 좌표를 계산할 수 없습니다.");
    ring.push(ring[0]);
    return [[ring]];
  }

  function intersectionArea(polygons, bounds, cellGeometry, cellBounds) {
    return polygons.length && intersectsBounds(bounds, cellBounds)
      ? geometryArea(clipping.intersection(cellGeometry, polygons))
      : 0;
  }

  function summarizeCoverage(dataset, stops, radius, areaPoints = [], comparisonStops = null) {
    const scope = analysisScope(dataset, areaPoints);
    let service = catchment(dataset, stops, radius);
    let comparison = comparisonStops ? catchment(dataset, comparisonStops, radius) : [];
    if (scope) {
      if (service.length) service = clipping.intersection(service, scope);
      if (comparison.length) comparison = clipping.intersection(comparison, scope);
    }
    const newlyCovered = comparison.length && service.length ? clipping.difference(service, comparison) : service;
    const bounds = geometryBounds(service);
    const comparisonBounds = geometryBounds(comparison);
    const newBounds = geometryBounds(newlyCovered);
    const scopeBounds = scope ? geometryBounds(scope) : dataset.bounds;
    const summary = {
      total: 0, covered: 0, comparisonCovered: 0, newlyCovered: 0,
      intersectedCells: 0, publishedCells: 0, unknownCells: 0, uncoveredCells: 0,
      uncoveredIds: new Set(), newIds: new Set(),
    };
    for (const cell of dataset.cells) {
      const scoped = scope ? clippingCell(cell, scope, scopeBounds) : cell.polygons;
      const scopedArea = scope ? geometryArea(scoped) : cell.area;
      if (scopedArea <= EPSILON_AREA) continue;
      summary.intersectedCells += 1;
      if (cell.value == null) {
        summary.unknownCells += 1;
        continue;
      }
      summary.publishedCells += 1;
      const residentDensity = cell.value / cell.area;
      const accessibleArea = Math.min(scopedArea, intersectionArea(service, bounds, cell.polygons, cell.bounds));
      summary.total += residentDensity * scopedArea;
      summary.covered += residentDensity * accessibleArea;
      if (cell.value > 0 && scopedArea - accessibleArea > EPSILON_AREA) {
        summary.uncoveredCells += 1;
        summary.uncoveredIds.add(cell.id);
      }
      if (comparisonStops) {
        const baseArea = Math.min(scopedArea, intersectionArea(comparison, comparisonBounds, cell.polygons, cell.bounds));
        const addedArea = Math.min(accessibleArea, intersectionArea(newlyCovered, newBounds, cell.polygons, cell.bounds));
        summary.comparisonCovered += residentDensity * baseArea;
        summary.newlyCovered += residentDensity * addedArea;
        if (cell.value > 0 && addedArea > EPSILON_AREA) summary.newIds.add(cell.id);
      }
    }
    return summary;
  }

  function clippingCell(cell, scope, bounds) {
    return intersectsBounds(bounds, cell.bounds) ? clipping.intersection(cell.polygons, scope) : [];
  }

  function summarizeStop(dataset, stop, radius, areaPoints = []) {
    const service = catchment(dataset, [stop], radius);
    const scope = analysisScope(dataset, areaPoints);
    const clipped = scope && service.length ? clipping.intersection(service, scope) : service;
    const bounds = geometryBounds(clipped);
    let covered = 0;
    let publishedCells = 0;
    let unknownCells = 0;
    for (const cell of dataset.cells) {
      const area = intersectionArea(clipped, bounds, cell.polygons, cell.bounds);
      if (area <= EPSILON_AREA) continue;
      if (cell.value == null) {
        unknownCells += 1;
      } else {
        covered += cell.value * Math.min(1, area / cell.area);
        publishedCells += 1;
      }
    }
    return { covered, publishedCells, unknownCells };
  }

  function ringContains(ring, x, y) {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const [x1, y1] = ring[index];
      const [x2, y2] = ring[previous];
      if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) {
        inside = !inside;
      }
    }
    return inside;
  }

  function findCell(dataset, point) {
    const [x, y] = pointToMeters(dataset.projection, point);
    return dataset.cells.find(({ bounds, polygons }) => (
      intersectsBounds(bounds, [x, y, x, y])
      && polygons.some(([outer, ...holes]) => (
        ringContains(outer, x, y) && !holes.some((hole) => ringContains(hole, x, y))
      ))
    ));
  }

  return { DEFAULT_STYLES, MAX_ZIP_BYTES, readPopulationZip, summarizeCoverage, summarizeStop, findCell };
});
