(function () {
  const DATABASE_NAME = "wonderlinx-public-data";
  const NUMBER = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
  const PERCENT = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1, style: "percent" });
  const UNKNOWN = { withheld: "비공개", missing: "통계없음" };
  let corePromise;
  let storagePromise;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error("격자 파일을 읽는 모듈을 불러오지 못했습니다."));
      };
      document.head.appendChild(script);
    });
  }

  function loadGridData() {
    if (!corePromise) {
      const libraries = [
        [window.fflate, "./node_modules/fflate/umd/index.js"],
        [window.shp, "./node_modules/shpjs/dist/shp.min.js"],
        [window.proj4, "./node_modules/proj4/dist/proj4.js"],
        [window.polygonClipping, "./node_modules/polygon-clipping/dist/polygon-clipping.umd.min.js"],
      ];
      corePromise = Promise.all(libraries.filter(([loaded]) => !loaded).map(([, src]) => loadScript(src)))
        .then(() => loadScript("./population-grid-data.js"))
        .then(() => window.WonderLinxPopulationGridData)
        .catch((error) => {
          corePromise = null;
          throw error;
        });
    }
    return corePromise;
  }

  function openStorage() {
    if (!storagePromise) {
      storagePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore("layers");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return storagePromise;
  }

  async function withStorage(mode, execute) {
    const database = await openStorage();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("layers", mode);
      const request = execute(tx.objectStore("layers"));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  function readStyles(text) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    const renderer = [...xml.getElementsByTagNameNS("*", "ClassBreakRenderer")]
      .find((item) => item.getAttribute("Field") === "val");
    const styles = [...(renderer?.getElementsByTagNameNS("*", "ClassBreakValue") || [])].flatMap((item) => {
      const minText = item.getElementsByTagNameNS("*", "Value")[0]?.textContent.trim();
      if (minText === "NULL") return [];
      const fill = item.getElementsByTagNameNS("*", "FillSymbol")[0];
      const color = fill?.getElementsByTagNameNS("*", "Color")[0]?.textContent.trim();
      const opacityText = fill?.getElementsByTagNameNS("*", "Opacity")[0]?.textContent.trim();
      const min = Number(minText);
      const opacity = Number(opacityText);
      if (!minText || !Number.isFinite(min) || min < 0 || !/^#[\da-f]{6}$/i.test(color) || !Number.isFinite(opacity) || opacity < 0 || opacity > 255) {
        throw new Error("범례 파일의 값 범위나 색상 형식을 읽을 수 없습니다.");
      }
      return [{ min, color, opacity: opacity / 255 }];
    }).sort((a, b) => a.min - b.min);
    if (!styles.length || styles[0].min !== 0 || styles.some((style, index) => index > 0 && style.min === styles[index - 1].min)) {
      throw new Error("val 필드의 구간 범례가 포함된 .msld 파일을 선택하세요.");
    }
    return styles;
  }

  function textRows(parent, rows) {
    parent.replaceChildren(...rows.map(([heading, value]) => {
      const row = document.createElement("div");
      row.className = "detail-row";
      const label = document.createElement("dt");
      label.textContent = heading;
      const detail = document.createElement("dd");
      detail.textContent = value;
      row.append(label, detail);
      return row;
    }));
  }

  function syncOptions(select, placeholder, options) {
    const value = select.value;
    const next = [["", placeholder], ...options];
    if (next.length !== select.options.length || next.some(([id, name], index) => (
      select.options[index].value !== String(id) || select.options[index].text !== name
    ))) {
      select.replaceChildren(...next.map(([id, name]) => new Option(name, id)));
      if (next.some(([id]) => String(id) === value)) select.value = value;
    }
  }

  function createLayer({ getContext, onChange }) {
    const el = (id) => document.getElementById(`population-grid-${id}`);
    const zipInput = el("file");
    const styleInput = el("style");
    const status = el("status");
    const controls = el("settings");
    const visibility = el("visible");
    const opacity = el("opacity");
    const radius = el("radius");
    const area = el("area");
    const comparison = el("comparison");
    const display = el("display");
    const focus = el("focus");
    const remove = el("remove");
    const legend = el("legend");
    const source = el("source");
    const route = el("route");
    const results = el("results");
    let core, dataset, storedFiles, styles, map, maps, info, analysis;
    let analysisError = false;
    let overlays = [];
    let analysisKey = "";
    let mapStyleKey = "";
    let legendKey = "";
    let loaded = false;
    let busy = false;

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle("error", isError);
    }

    function setBusy(value) {
      busy = value;
      zipInput.disabled = value;
      styleInput.disabled = value;
      remove.disabled = value;
    }

    function clearOverlays() {
      overlays.forEach(({ polygon }) => polygon.setMap(null));
      overlays = [];
      mapStyleKey = "";
      info?.close();
    }

    function areaPoints(context) {
      return context.areas.find((item) => item.id === area.value)?.points || [];
    }

    function formatPeople(value) {
      return `${NUMBER.format(value)}명`;
    }

    function describeStop(stop, { radiusMeters = Number(radius.value), wholeCircle = false } = {}) {
      if (!dataset || !stop) return null;
      const currentArea = wholeCircle ? [] : areaPoints(getContext());
      const label = `${dataset.metric} (추정)`;
      let summary;
      try {
        summary = core.summarizeStop(dataset, stop, radiusMeters, currentArea);
      } catch (error) {
        console.warn("정류장 격자 집계 실패", error);
        return { label, value: "반경 집계 실패" };
      }
      const value = summary.publishedCells ? formatPeople(summary.covered)
        : summary.unknownCells ? "공개값 없음" : "자료 범위 밖";
      const note = [dataset.resolution ? `${dataset.resolution} 격자` : "", dataset.month,
        currentArea.length ? "관찰 구역 안" : "", summary.unknownCells ? `미집계 격자 ${summary.unknownCells}개` : ""]
        .filter(Boolean).join(" · ");
      return {
        label,
        value: note ? `${value} (${note})` : value,
      };
    }

    function drawLegend() {
      const key = JSON.stringify([display.value, styles]);
      if (key === legendKey) return;
      legendKey = key;
      let entries;
      if (display.value === "population") {
        entries = styles.map((style, index) => [
          style.color,
          index < styles.length - 1 ? `${NUMBER.format(style.min)}–${NUMBER.format(styles[index + 1].min - 1)}명` : `${NUMBER.format(style.min)}명 이상`,
        ]);
      } else {
        entries = [display.value === "uncovered" ? ["#A73E24", "접근권 밖 면적이 남은 격자"] : ["#20816B", "새로 접근권에 포함된 격자"]];
      }
      entries.push(["#A1AAB4", "비공개"], ["#F1F2F4", "통계없음"]);
      legend.replaceChildren(...entries.map(([color, label]) => {
        const item = document.createElement("span");
        const swatch = document.createElement("i");
        swatch.style.backgroundColor = color;
        swatch.setAttribute("aria-hidden", "true");
        item.append(swatch, label);
        return item;
      }));
    }

    function drawMap() {
      if (!map || !dataset || !visibility.checked) {
        clearOverlays();
        return;
      }
      const key = JSON.stringify([display.value, opacity.value, styles, display.value === "population" ? "" : analysisKey]);
      if (key === mapStyleKey) return;
      mapStyleKey = key;
      const densityOpacity = Number(opacity.value) / 100;
      if (!overlays.length) {
        for (const cell of dataset.cells) {
          for (const shape of cell.polygons) {
            const path = shape.map((ring) => ring.map((coordinate) => {
              const [lng, lat] = dataset.projection.forward(coordinate);
              return new maps.LatLng(lat, lng);
            }));
            const polygon = new maps.Polygon({ path, zIndex: 0, strokeWeight: 1, clickable: false });
            overlays.push({ cell, polygon });
          }
        }
      }
      for (const { cell, polygon } of overlays) {
        const missing = cell.state === "missing";
        let fillColor = missing ? "#F1F2F4" : "#A1AAB4";
        let fillOpacity = missing ? 0.025 : densityOpacity / 3;
        let shown = true;
        if (cell.value != null) {
          if (display.value === "population") {
            const style = styles.findLast((entry) => cell.value >= entry.min);
            fillColor = style.color;
            fillOpacity = Math.min(1, style.opacity * densityOpacity / 0.47);
          } else {
            const isUncovered = display.value === "uncovered";
            shown = isUncovered ? analysis?.uncoveredIds.has(cell.id) : analysis?.newIds.has(cell.id);
            fillColor = isUncovered ? "#A73E24" : "#20816B";
            fillOpacity = densityOpacity;
          }
        }
        polygon.setOptions({ strokeColor: "#A2A3A7", strokeOpacity: missing ? 0.22 : 0.27, fillColor, fillOpacity });
        polygon.setMap(shown ? map : null);
      }
    }

    function refresh() {
      if (!dataset) {
        controls.hidden = true;
        clearOverlays();
        return;
      }
      controls.hidden = false;
      const ctx = getContext();
      syncOptions(area, "업로드 구역 전체", ctx.areas.filter((item) => item.points.length >= 3).map((item) => [item.id, item.name]));
      syncOptions(comparison, "비교 노선 선택", ctx.routes.filter((name) => name !== ctx.selectedRoute).map((name) => [name, name]));
      display.options[1].disabled = !ctx.selectedRoute;
      display.options[2].disabled = !ctx.selectedRoute || !comparison.value;
      if (display.selectedOptions[0]?.disabled) display.value = "population";

      const stops = ctx.selectedRoute ? ctx.getStops(ctx.selectedRoute) : [];
      const comparisonStops = ctx.selectedRoute && comparison.value ? ctx.getStops(comparison.value) : null;
      const scope = areaPoints(ctx);
      const nextKey = JSON.stringify([Boolean(ctx.selectedRoute), radius.value, scope, stops.map(({ lat, lng }) => [lat, lng]),
        comparisonStops?.map(({ lat, lng }) => [lat, lng])]);
      if (nextKey !== analysisKey) {
        analysisKey = nextKey;
        analysisError = false;
        try {
          analysis = ctx.selectedRoute ? core.summarizeCoverage(dataset, stops, Number(radius.value), scope, comparisonStops) : null;
        } catch (error) {
          console.warn("노선 격자 집계 실패", error);
          analysis = null;
          analysisError = true;
        }
      }
      route.textContent = ctx.selectedRoute || "노선을 선택하면 접근권을 계산합니다.";
      let rows = [];
      if (analysisError) rows.push(["접근권 집계", "정류장 또는 관찰 구역 좌표를 확인하세요."]);
      if (ctx.selectedRoute && analysis) {
        rows = [
          ["분석 정류장", `${stops.length}개`],
          [`접근권 내 ${dataset.metric}`, analysis.publishedCells && stops.length ? formatPeople(analysis.covered) : "집계 가능한 자료 없음"],
          ["접근 비율", analysis.total > 0 && stops.length ? PERCENT.format(analysis.covered / analysis.total) : "—"],
          ["미커버 격자", `${analysis.uncoveredCells}개`],
          ["비공개·통계없음", `${analysis.unknownCells}개`],
        ];
        if (comparisonStops) {
          rows.push(["비교 노선 접근권", analysis.publishedCells ? formatPeople(analysis.comparisonCovered) : "집계 가능한 자료 없음"]);
          rows.push(["비교 노선 대비 신규 접근", analysis.publishedCells ? formatPeople(analysis.newlyCovered) : "집계 가능한 자료 없음"]);
        }
      }
      textRows(results, rows);
      drawLegend();
      drawMap();
    }

    function applyFiles(files, nextDataset, nextStyles) {
      clearOverlays();
      storedFiles = files;
      dataset = nextDataset;
      styles = nextStyles;
      analysisKey = "";
      if (dataset) {
        const { counts } = dataset;
        source.textContent = [
          [dataset.metric, dataset.resolution, dataset.month].filter(Boolean).join(" · "),
          `공개 ${NUMBER.format(counts.published)}개 · 비공개 ${NUMBER.format(counts.withheld)}개 · 통계없음 ${NUMBER.format(counts.missing)}개`,
        ].join("\n");
        source.title = dataset.fileName;
      }
      refresh();
      onChange();
    }

    function focusLayer() {
      if (!map || !dataset) return;
      const bounds = new maps.LatLngBounds();
      const [minX, minY, maxX, maxY] = dataset.bounds;
      for (const corner of [[minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY]]) {
        const [lng, lat] = dataset.projection.forward(corner);
        bounds.extend(new maps.LatLng(lat, lng));
      }
      map.setBounds(bounds);
    }

    async function importFiles(readFiles, zoom) {
      if (busy) return;
      setBusy(true);
      let applied = false;
      try {
        core = await loadGridData();
        const files = await readFiles();
        if (!files) return;
        const nextDataset = files.zip ? core.readPopulationZip(await files.zip.arrayBuffer(), files.zip.name) : null;
        const nextStyles = files.legend ? readStyles(await files.legend.text()) : core.DEFAULT_STYLES;
        applyFiles(files, nextDataset, nextStyles);
        applied = true;
        await withStorage("readwrite", (store) => store.put(files, "active"));
        setStatus(nextDataset ? (files.legend ? "격자와 범례를 불러왔습니다." : "격자를 불러왔습니다.") : "범례를 불러왔습니다. 인구 격자 ZIP을 선택하세요.");
      } catch (error) {
        setStatus(applied ? "지도에 반영했습니다. 브라우저 저장 공간에 보관할 수 없습니다." : `파일을 불러오지 못했습니다. ${error.message}`, true);
      } finally {
        setBusy(false);
      }
      if (zoom && applied) {
        visibility.checked = true;
        refresh();
        focusLayer();
      }
    }

    zipInput.addEventListener("change", () => {
      const file = zipInput.files[0];
      zipInput.value = "";
      if (!file) return;
      importFiles(() => {
        if (file.size > core.MAX_ZIP_BYTES) throw new Error("15MB 이하의 국토통계지도 ZIP을 선택하세요.");
        return { ...storedFiles, zip: file };
      }, true);
    });
    styleInput.addEventListener("change", () => {
      const file = styleInput.files[0];
      styleInput.value = "";
      if (!file) return;
      importFiles(() => {
        if (file.size > 256 * 1024) throw new Error("256KB 이하의 .msld 범례 파일을 선택하세요.");
        return { ...storedFiles, legend: file };
      }, false);
    });
    remove.addEventListener("click", async () => {
      setBusy(true);
      try {
        await withStorage("readwrite", (store) => store.delete("active"));
        applyFiles(null, null, null);
        setStatus("인구 격자 레이어를 제거했습니다.");
      } catch {
        setStatus("저장된 격자 레이어를 제거하지 못했습니다.", true);
      } finally {
        setBusy(false);
      }
    });
    focus.addEventListener("click", focusLayer);
    opacity.addEventListener("input", drawMap);
    for (const field of [visibility, display, radius, area, comparison]) {
      field.addEventListener("change", () => {
        refresh();
        if (field === radius || field === area) onChange();
      });
    }

    return {
      refresh,
      describeStop,
      attachMap(nextMap, mapSdk) {
        map = nextMap;
        maps = mapSdk;
        info = new maps.InfoWindow({ removable: true, disableAutoPan: true });
        drawMap();
      },
      closeCell() {
        info?.close();
      },
      showCell(lat, lng) {
        if (!map || !dataset || !visibility.checked) return false;
        const cell = core.findCell(dataset, { lat, lng });
        if (!cell || (cell.value != null && (
          display.value === "uncovered" && !analysis?.uncoveredIds.has(cell.id)
          || display.value === "new" && !analysis?.newIds.has(cell.id)
        ))) return false;
        const content = document.createElement("div");
        content.className = "population-grid-info";
        const title = document.createElement("strong");
        title.textContent = `${dataset.metric} ${cell.value == null ? UNKNOWN[cell.state] : formatPeople(cell.value)}`;
        const detail = document.createElement("span");
        detail.textContent = [cell.id, dataset.month].filter(Boolean).join(" · ");
        content.append(title, detail);
        info.setContent(content);
        info.setPosition(new maps.LatLng(lat, lng));
        info.open(map);
        return true;
      },
      async restore() {
        if (loaded) return;
        loaded = true;
        setBusy(true);
        try {
          const files = await withStorage("readonly", (store) => store.get("active"));
          if (files) {
            setBusy(false);
            await importFiles(() => files, false);
          }
        } catch (error) {
          console.warn("인구 격자 저장소를 열 수 없습니다.", error);
        } finally {
          setBusy(false);
        }
      },
    };
  }

  window.createWonderLinxPopulationGrid = createLayer;
})();
