(function () {
  const CUSTOM_POINTS_KEY = "kml-kakao-map.custom-points";
  const CUSTOM_PATHS_KEY = "kml-kakao-map.custom-paths";
  const OVERRIDES_KEY = "kml-kakao-map.point-overrides";
  const PATH_OVERRIDES_KEY = "kml-kakao-map.path-overrides";
  const ROUTE_SETTINGS_KEY = "kml-kakao-map.route-settings";
  const ROUTE_LIST_TITLES_KEY = "kml-kakao-map.route-list-titles";
  const UPLOADED_POINTS_KEY = "kml-kakao-map.uploaded-points";
  const UPLOADED_PATHS_KEY = "kml-kakao-map.uploaded-paths";
  const UPLOADED_FILE_SUMMARIES_KEY = "kml-kakao-map.uploaded-file-summaries";
  const OBSERVATION_AREAS_KEY = "kml-kakao-map.observation-areas";
  const UI_STATE_KEY = "kml-kakao-map.ui-state";
  const NEW_ROUTE_VALUE = "__new_route__";
  const TEMP_NEW_ROUTE_NAME = "__temp_new_route__";
  const DEFAULT_ROUTE_NAME = "기본 노선";
  const AUTO_SAVE_FILENAME = "autosaved-map.kml";
  const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000;
  const UNDO_HISTORY_LIMIT = 10;
  const OPTIMIZATION_FEATURE_ENABLED = false;

  const config = window.KAKAO_MAP_CONFIG || {};
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const statusEl = document.getElementById("status");
  const fileCountEl = document.getElementById("file-count");
  const pointCountEl = document.getElementById("point-count");
  const fileListEl = document.getElementById("file-list");
  const saveKmlButtonEl = document.getElementById("save-kml-button");
  const saveResetButtonEl = document.getElementById("save-reset-button");
  const exportRidershipCsvButtonEl = document.getElementById("export-ridership-csv-button");
  const importRidershipCsvButtonEl = document.getElementById("import-ridership-csv-button");
  const ridershipFileInputEl = document.getElementById("ridership-file-input");
  const analyzeRoutesButtonEl = document.getElementById("analyze-routes-button");
  const compareRouteGroupsButtonEl = document.getElementById("compare-route-groups-button");
  const optimizeRoutesButtonEl = document.getElementById("optimize-routes-button");
  const showAllRoutesButtonEl = document.getElementById("show-all-routes-button");
  const hideAllRoutesButtonEl = document.getElementById("hide-all-routes-button");
  const toggleOriginalRoutesButtonEl = document.getElementById("toggle-original-routes-button");
  const toggleMergedRoutesButtonEl = document.getElementById("toggle-merged-routes-button");
  const routeListEl = document.getElementById("route-list");
  const mergedRouteListEl = document.getElementById("merged-route-list");
  const routePointListEl = document.getElementById("route-point-list");
  const routeMergePanelEl = document.getElementById("route-merge-panel");
  const routeMergeSummaryEl = document.getElementById("route-merge-summary");
  const mergeRouteASelectEl = document.getElementById("merge-route-a-select");
  const mergeRouteBSelectEl = document.getElementById("merge-route-b-select");
  const simpleMergeCheckboxEl = document.getElementById("simple-merge-checkbox");
  const mergeRoutesButtonEl = document.getElementById("merge-routes-button");
  const viewMergedRouteButtonEl = document.getElementById("view-merged-route-button");
  const pointDetailsSectionEl = document.getElementById("point-details-section");
  const pointDetailsToggleEl = document.getElementById("point-details-toggle");
  const pointFormSectionEl = document.getElementById("point-form-section");
  const pointFormToggleEl = document.getElementById("point-form-toggle");
  const pointDetailsEl = document.getElementById("point-details");
  const pointFormEl = document.getElementById("point-form");
  const pathDetailsEl = document.getElementById("path-details");
  const pathFormEl = document.getElementById("path-form");
  const addPointButtonEl = document.getElementById("add-point-button");
  const resetPointButtonEl = document.getElementById("reset-point-button");
  const deletePointButtonEl = document.getElementById("delete-point-button");
  const moveRouteSelectEl = document.getElementById("move-route-select");
  const movePointButtonEl = document.getElementById("move-point-button");
  const formRouteSelectEl = document.getElementById("form-route-select");
  const newRouteFieldEl = document.getElementById("new-route-field");
  const newRouteNameEl = document.getElementById("form-new-route-name");
  const pathRouteSelectEl = document.getElementById("path-route-select");
  const pathNewRouteFieldEl = document.getElementById("path-new-route-field");
  const pathNewRouteNameEl = document.getElementById("path-new-route-name");
  const startPathDrawButtonEl = document.getElementById("start-path-draw-button");
  const startPathEditButtonEl = document.getElementById("start-path-edit-button");
  const designRouteButtonEl = document.getElementById("design-route-button");
  const resetDesignedRouteButtonEl = document.getElementById("reset-designed-route-button");
  const villageBusDesignPanelEl = document.getElementById("village-bus-design-panel");
  const villageBusRouteCaptionEl = document.getElementById("village-bus-route-caption");
  const villageBusDesignSummaryEl = document.getElementById("village-bus-design-summary");
  const designVillageBusRouteButtonEl = document.getElementById("design-village-bus-route-button");
  const resetVillageBusRouteButtonEl = document.getElementById("reset-village-bus-route-button");
  const villagePrioritySelectEl = document.getElementById("village-priority-select");
  let saveDesignedPathButtonEl = document.getElementById("save-designed-path-button");
  const editPointButtonEl = document.getElementById("edit-point-button");
  const finishPathButtonEl = document.getElementById("finish-path-button");
  const cancelPathButtonEl = document.getElementById("cancel-path-button");
  const deletePathButtonEl = document.getElementById("delete-path-button");
  const pathEditorHelpEl = document.getElementById("path-editor-help");
  const analysisModalEl = document.getElementById("analysis-modal");
  const analysisModalBodyEl = document.getElementById("analysis-modal-body");
  const analysisModalCloseEl = document.getElementById("analysis-modal-close");
  const mapSearchFormEl = document.getElementById("map-search-form");
  const mapSearchInputEl = document.getElementById("map-search-input");
  const mapSearchButtonEl = document.getElementById("map-search-button");
  const mapSearchClearEl = document.getElementById("map-search-clear");
  const helpButtonEl = document.getElementById("help-button");
  const observationAreaNameEl = document.getElementById("observation-area-name");
  const observationAreaColorEl = document.getElementById("observation-area-color");
  const startObservationAreaButtonEl = document.getElementById("start-observation-area-button");
  const updateObservationAreaButtonEl = document.getElementById("update-observation-area-button");
  const moveObservationAreaButtonEl = document.getElementById("move-observation-area-button");
  const editObservationAreaButtonEl = document.getElementById("edit-observation-area-button");
  const saveObservationAreaButtonEl = document.getElementById("save-observation-area-button");
  const cancelObservationAreaButtonEl = document.getElementById("cancel-observation-area-button");
  const observationAreaListEl = document.getElementById("observation-area-list");

  const formEls = {
    name: document.getElementById("form-name"),
    fileName: document.getElementById("form-file-name"),
    lat: document.getElementById("form-lat"),
    lng: document.getElementById("form-lng"),
    description: document.getElementById("form-description"),
  };

  const pathFormEls = {
    name: document.getElementById("path-name"),
    description: document.getElementById("path-description"),
  };

  let map = null;
  let mapReady = false;
  let addPointMode = false;
  let drawPathMode = false;
  let editPathMode = false;
  let pathExtendMode = false;
  let selectedPathVertexIndex = null;
  let relocatePointId = null;
  let selectedRouteName = null;
  let mergeRouteAName = null;
  let mergeRouteBName = null;
  let latestMergedRouteName = null;
  let selectedPointId = null;
  let selectedPathId = null;
  let draggedRoutePointId = null;
  let draggedRouteName = null;
  let editingRouteName = null;
  let editingPointId = null;
  let routeListSearchQueries = {
    original: "",
    merged: "",
  };
  const routeListAnalyzeButtons = {};
  let pointListSearchQuery = "";
  let hasClearedSelection = false;
  let mapMouseMoveHandler = null;
  let activeAnalysisGroup = null;
  let highlightedRouteNames = [];

  let markers = [];
  let infoWindows = [];
  let polylines = [];
  let directionOverlays = [];
  let pathVertexMarkers = [];
  let pathPreviewPolyline = null;
  let pathPreviewDirectionOverlays = [];
  let pathContextMenuOverlay = null;
  let draftMarker = null;
  let analysisMarkers = [];
  let analysisPolylines = [];
  let analysisCircles = [];
  let analysisInfoWindows = [];
  let observationAreaPolygons = [];
  let observationAreaBorders = [];
  let observationAreaLabels = [];
  let observationAreaVertexMarkers = [];
  let observationAreaPreviewPolygon = null;
  let observationAreaEditMarkers = [];
  let hoveredObservationAreaId = null;
  let designedRouteInfoWindows = [];
  let mapSearchPlaces = null;
  let mapSearchMarker = null;
  let mapSearchInfoWindow = null;
  let latestAnalysisReport = null;
  let latestOptimizationPlan = null;
  let analysisActive = false;
  let observationAreas = loadJsonArray(OBSERVATION_AREAS_KEY).map(normalizeObservationArea);
  let observationAreaDrawMode = false;
  let observationAreaMoveMode = false;
  let observationAreaEditMode = false;
  let workingObservationAreaPoints = [];
  let selectedObservationAreaId = null;
  let observationAreaDragState = null;

  let uploadedPoints = loadJsonArray(UPLOADED_POINTS_KEY);
  let uploadedPaths = loadJsonArray(UPLOADED_PATHS_KEY);
  let uploadedFileSummaries = loadJsonArray(UPLOADED_FILE_SUMMARIES_KEY);
  let customPoints = loadJsonArray(CUSTOM_POINTS_KEY).map(normalizeCustomPoint);
  let customPaths = loadJsonArray(CUSTOM_PATHS_KEY);
  let pointOverrides = loadJsonObject(OVERRIDES_KEY);
  let pathOverrides = loadJsonObject(PATH_OVERRIDES_KEY);
  let routeSettings = loadJsonObject(ROUTE_SETTINGS_KEY);
  let routeListTitles = {
    original: "불러온 노선",
    merged: "병합된 노선",
    ...loadJsonObject(ROUTE_LIST_TITLES_KEY),
  };
  const savedUiState = loadJsonObject(UI_STATE_KEY);
  let workingPathCoordinates = [];
  let autoSaveTimer = null;
  let shouldFitMapToData = true;
  let undoHistory = [];
  let isRestoringUndo = false;

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
  }

  function normalizeRidershipValue(value) {
    if (value == null || value === "") {
      return null;
    }
    const normalized = Number(String(value).trim().replace(/,/g, ""));
    if (!Number.isFinite(normalized) || normalized < 0) {
      return null;
    }
    return Math.round(normalized);
  }

  function formatRidershipValue(value) {
    const normalized = normalizeRidershipValue(value);
    return normalized == null ? "" : normalized.toLocaleString("ko-KR");
  }

  function buildStopKey(routeName, stopName, lat, lng) {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return "";
    }
    return [
      normalizeRouteName(routeName || DEFAULT_ROUTE_NAME),
      String(stopName || "").trim(),
      Number(lat).toFixed(6),
      Number(lng).toFixed(6),
    ].join("|");
  }

  function getPointStopKey(point) {
    if (!point) {
      return "";
    }
    return buildStopKey(point.routeName, point.name, point.lat, point.lng);
  }

  function logRenameRouteDebug(stage, payload = {}) {
    window.fetch("/api/debug-rename-route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stage,
        payload,
      }),
    }).catch(() => {});
  }

  function clearMapSearchResult() {
    if (mapSearchMarker) {
      mapSearchMarker.setMap(null);
      mapSearchMarker = null;
    }
    if (mapSearchInfoWindow) {
      mapSearchInfoWindow.close();
    }
  }

  function getObservationAreaCenter(points) {
    if (!Array.isArray(points) || !points.length) {
      return null;
    }
    const total = points.reduce(
      (sum, point) => ({
        lat: sum.lat + Number(point.lat || 0),
        lng: sum.lng + Number(point.lng || 0),
      }),
      { lat: 0, lng: 0 }
    );
    return {
      lat: total.lat / points.length,
      lng: total.lng / points.length,
    };
  }

  function normalizeHexColor(value, fallback = "#2f8cff") {
    const normalized = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback;
  }

  function hexToRgba(hexColor, alpha) {
    const color = normalizeHexColor(hexColor);
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function buildObservationAreaPath(points) {
    return (Array.isArray(points) ? points : []).map(
      (point) => new window.kakao.maps.LatLng(Number(point.lat), Number(point.lng))
    );
  }

  function clearObservationAreaOverlays() {
    observationAreaPolygons.forEach((item) => item.setMap(null));
    observationAreaBorders.forEach((item) => item.setMap(null));
    observationAreaLabels.forEach((item) => item.setMap(null));
    observationAreaVertexMarkers.forEach((item) => item.setMap(null));
    observationAreaEditMarkers.forEach((item) => item.setMap(null));
    observationAreaPolygons = [];
    observationAreaBorders = [];
    observationAreaLabels = [];
    observationAreaVertexMarkers = [];
    observationAreaEditMarkers = [];
    if (observationAreaPreviewPolygon) {
      observationAreaPreviewPolygon.setMap(null);
      observationAreaPreviewPolygon = null;
    }
  }

  function renderObservationAreas() {
    clearObservationAreaOverlays();
    if (!mapReady || !map) {
      return;
    }

    observationAreas.forEach((area) => {
      if (area.hidden || !Array.isArray(area.points) || area.points.length < 3) {
        return;
      }

      const path = buildObservationAreaPath(area.points);
      const polygon = new window.kakao.maps.Polygon({
        map,
        path,
        strokeWeight: area.id === selectedObservationAreaId ? 3 : 1,
        strokeColor: normalizeHexColor(area.color, "#2f8cff"),
        strokeOpacity: area.id === selectedObservationAreaId ? 0.92 : 0.38,
        fillColor: normalizeHexColor(area.color, "#2f8cff"),
        fillOpacity: area.id === selectedObservationAreaId ? 0.32 : 0.22,
      });
      observationAreaPolygons.push(polygon);

      const borderPath = path.length >= 2 ? [...path, path[0]] : path;
      const border = new window.kakao.maps.Polyline({
        map,
        path: borderPath,
        strokeWeight: area.id === selectedObservationAreaId ? 5 : 2,
        strokeColor: normalizeHexColor(area.color, "#2f8cff"),
        strokeOpacity: area.id === selectedObservationAreaId ? 0.98 : 0.55,
      });
      observationAreaBorders.push(border);

      const center = getObservationAreaCenter(area.points);
      if (center && hoveredObservationAreaId === area.id) {
        const label = new window.kakao.maps.CustomOverlay({
          map,
          position: new window.kakao.maps.LatLng(center.lat, center.lng),
          yAnchor: 1.2,
          content: `<div style="padding:6px 10px;border:1px solid ${hexToRgba(area.color, 0.24)};border-radius:999px;background:rgba(255,255,255,0.96);font-size:12px;font-weight:700;color:#20476f;box-shadow:0 10px 18px rgba(38,65,96,0.12);">${escapeHtml(area.name)}</div>`,
        });
        observationAreaLabels.push(label);
      }

      const selectObservationArea = () => {
        selectedObservationAreaId = area.id;
        refreshUI();
      };
      const showObservationAreaLabel = () => {
        if (hoveredObservationAreaId === area.id) {
          return;
        }
        hoveredObservationAreaId = area.id;
        renderObservationAreas();
      };
      const hideObservationAreaLabel = () => {
        if (hoveredObservationAreaId !== area.id) {
          return;
        }
        hoveredObservationAreaId = null;
        renderObservationAreas();
      };

      window.kakao.maps.event.addListener(polygon, "click", selectObservationArea);
      window.kakao.maps.event.addListener(border, "click", selectObservationArea);
      window.kakao.maps.event.addListener(polygon, "mouseover", showObservationAreaLabel);
      window.kakao.maps.event.addListener(border, "mouseover", showObservationAreaLabel);
      window.kakao.maps.event.addListener(polygon, "mouseout", hideObservationAreaLabel);
      window.kakao.maps.event.addListener(border, "mouseout", hideObservationAreaLabel);

      window.kakao.maps.event.addListener(polygon, "mousedown", (mouseEvent) => {
        beginObservationAreaDrag(area.id, mouseEvent);
      });

      if (area.id === selectedObservationAreaId && observationAreaEditMode) {
        observationAreaEditMarkers = area.points.map((point, index) => {
          const marker = new window.kakao.maps.Marker({
            map,
            position: new window.kakao.maps.LatLng(point.lat, point.lng),
            title: `${area.name} 꼭짓점 ${index + 1}`,
            draggable: true,
          });
          window.kakao.maps.event.addListener(marker, "dragstart", () => {
            pushUndoSnapshot();
          });
          window.kakao.maps.event.addListener(marker, "dragend", () => {
            const dragged = marker.getPosition();
            updateObservationAreaVertex(area.id, index, Number(dragged.getLat().toFixed(7)), Number(dragged.getLng().toFixed(7)));
          });
          window.kakao.maps.event.addListener(marker, "rightclick", () => {
            showPathContextMenu(marker.getPosition(), [
              {
                label: "포인트 삭제",
                danger: true,
                onClick: () => {
                  deleteObservationAreaVertex(area.id, index);
                },
              },
              {
                label: "포인트 추가",
                onClick: () => {
                  insertObservationAreaVertex(area.id, index);
                },
              },
            ]);
          });
          return marker;
        });
      }
    });

    if (observationAreaDrawMode && workingObservationAreaPoints.length) {
      observationAreaVertexMarkers = workingObservationAreaPoints.map((point, index) => new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        title: `관찰 구역 점 ${index + 1}`,
      }));

      observationAreaPreviewPolygon = new window.kakao.maps.Polygon({
        map,
        path: buildObservationAreaPath(workingObservationAreaPoints),
        strokeWeight: 2,
        strokeColor: normalizeHexColor(observationAreaColorEl?.value, "#2f8cff"),
        strokeOpacity: 0.95,
        strokeStyle: "shortdash",
        fillColor: normalizeHexColor(observationAreaColorEl?.value, "#2f8cff"),
        fillOpacity: workingObservationAreaPoints.length >= 3 ? 0.18 : 0.08,
      });
    }
  }

  function beginObservationAreaDrag(areaId, mouseEvent) {
    if (!observationAreaMoveMode || areaId !== selectedObservationAreaId) {
      return;
    }
    const lat = Number(mouseEvent?.latLng?.getLat?.().toFixed(7));
    const lng = Number(mouseEvent?.latLng?.getLng?.().toFixed(7));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    pushUndoSnapshot();
    observationAreaDragState = {
      areaId,
      lastLat: lat,
      lastLng: lng,
    };
    if (window.kakao?.maps?.event) {
      window.kakao.maps.event.preventMap();
    }
    setStatus("관찰 구역을 드래그해 이동 중입니다. 마우스를 놓으면 위치가 저장됩니다.", false);
  }

  function handleObservationAreaDrag(mouseEvent) {
    if (!observationAreaDragState) {
      return;
    }
    const lat = Number(mouseEvent?.latLng?.getLat?.().toFixed(7));
    const lng = Number(mouseEvent?.latLng?.getLng?.().toFixed(7));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const deltaLat = lat - observationAreaDragState.lastLat;
    const deltaLng = lng - observationAreaDragState.lastLng;
    if (!deltaLat && !deltaLng) {
      return;
    }

    updateObservationArea(
      observationAreaDragState.areaId,
      (area) => ({
        ...area,
        points: area.points.map((point) => ({
          lat: Number((point.lat + deltaLat).toFixed(7)),
          lng: Number((point.lng + deltaLng).toFixed(7)),
        })),
      }),
      { persist: false }
    );
    observationAreaDragState.lastLat = lat;
    observationAreaDragState.lastLng = lng;
    renderObservationAreas();
  }

  function finishObservationAreaDrag() {
    if (!observationAreaDragState) {
      return;
    }
    const area = observationAreas.find((item) => item.id === observationAreaDragState.areaId);
    observationAreaDragState = null;
    saveObservationAreas();
    refreshUI();
    if (area) {
      setStatus(`"${area.name}" 구역 위치를 저장했습니다.`, false);
    }
  }

  function showMapSearchResult(place) {
    if (!mapReady || !place) {
      return;
    }

    clearMapSearchResult();

    const lat = Number(place.y);
    const lng = Number(place.x);
    const position = new window.kakao.maps.LatLng(lat, lng);
    mapSearchMarker = new window.kakao.maps.Marker({
      map,
      position,
      title: place.place_name || place.address_name || "검색 결과",
    });

    if (mapSearchInfoWindow) {
      mapSearchInfoWindow.setContent(
        `<div style="padding:7px 10px;font-size:12px;line-height:1.45;"><strong>${escapeHtml(
          place.place_name || place.address_name || "검색 결과"
        )}</strong></div>`
      );
      mapSearchInfoWindow.open(map, mapSearchMarker);
    }

    map.setLevel(4);
    map.panTo(position);
  }

  function handleMapSearchSubmit(event) {
    event?.preventDefault?.();

    const query = mapSearchInputEl?.value?.trim();
    if (!query) {
      setStatus("검색할 지역이나 장소 이름을 입력하세요.", true);
      return;
    }

    if (!mapReady || !mapSearchPlaces) {
      setStatus("카카오 검색 기능을 아직 사용할 수 없습니다.", true);
      return;
    }

    mapSearchButtonEl.disabled = true;
    mapSearchPlaces.keywordSearch(query, (data, status) => {
      mapSearchButtonEl.disabled = false;

      if (status !== window.kakao.maps.services.Status.OK || !Array.isArray(data) || !data.length) {
        clearMapSearchResult();
        setStatus(`"${query}" 검색 결과를 찾지 못했습니다.`, true);
        return;
      }

      showMapSearchResult(data[0]);
      setStatus(`"${query}" 검색 결과를 지도에 표시했습니다.`, false);
    });
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function captureMapView() {
    if (!mapReady || !map) {
      return null;
    }

    const center = map.getCenter();
    return {
      lat: Number(center.getLat().toFixed(7)),
      lng: Number(center.getLng().toFixed(7)),
      level: map.getLevel(),
    };
  }

  function createUndoSnapshot() {
    return {
      uploadedPoints: cloneJson(uploadedPoints),
      uploadedPaths: cloneJson(uploadedPaths),
      uploadedFileSummaries: cloneJson(uploadedFileSummaries),
      customPoints: cloneJson(customPoints),
      customPaths: cloneJson(customPaths),
      pointOverrides: cloneJson(pointOverrides),
      pathOverrides: cloneJson(pathOverrides),
      routeSettings: cloneJson(routeSettings),
      observationAreas: cloneJson(observationAreas),
      selectedRouteName,
      mergeRouteAName,
      mergeRouteBName,
      latestMergedRouteName,
      selectedPointId,
      selectedPathId,
      selectedObservationAreaId,
      addPointMode,
      observationAreaDrawMode,
      drawPathMode,
      editPathMode,
      pathExtendMode,
      selectedPathVertexIndex,
      relocatePointId,
      hasClearedSelection,
      workingPathCoordinates: cloneJson(workingPathCoordinates),
      workingObservationAreaPoints: cloneJson(workingObservationAreaPoints),
      mapView: captureMapView(),
    };
  }

  function persistWorkspaceState() {
    window.localStorage.setItem(CUSTOM_POINTS_KEY, JSON.stringify(customPoints));
    window.localStorage.setItem(CUSTOM_PATHS_KEY, JSON.stringify(customPaths));
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(pointOverrides));
    window.localStorage.setItem(PATH_OVERRIDES_KEY, JSON.stringify(pathOverrides));
    window.localStorage.setItem(ROUTE_SETTINGS_KEY, JSON.stringify(routeSettings));
    window.localStorage.setItem(ROUTE_LIST_TITLES_KEY, JSON.stringify(routeListTitles));
    window.localStorage.setItem(UPLOADED_POINTS_KEY, JSON.stringify(uploadedPoints));
    window.localStorage.setItem(UPLOADED_PATHS_KEY, JSON.stringify(uploadedPaths));
    window.localStorage.setItem(UPLOADED_FILE_SUMMARIES_KEY, JSON.stringify(uploadedFileSummaries));
    window.localStorage.setItem(OBSERVATION_AREAS_KEY, JSON.stringify(observationAreas));
    saveUiState();
  }

  function pushUndoSnapshot() {
    if (isRestoringUndo) {
      return;
    }

    const snapshot = createUndoSnapshot();
    const serialized = JSON.stringify(snapshot);
    const latestEntry = undoHistory[undoHistory.length - 1];
    if (latestEntry?.serialized === serialized) {
      return;
    }

    undoHistory.push({ snapshot, serialized });
    if (undoHistory.length > UNDO_HISTORY_LIMIT) {
      undoHistory = undoHistory.slice(-UNDO_HISTORY_LIMIT);
    }
  }

  function restoreUndoSnapshot(snapshot) {
    isRestoringUndo = true;

    stopPathModes();
    stopRelocateMode();
    setAddPointMode(false);
    clearDraftMarker();
    closeAnalysisModal();

    uploadedPoints = cloneJson(snapshot.uploadedPoints || []);
    uploadedPaths = cloneJson(snapshot.uploadedPaths || []);
    uploadedFileSummaries = cloneJson(snapshot.uploadedFileSummaries || []);
    customPoints = cloneJson(snapshot.customPoints || []).map(normalizeCustomPoint);
    customPaths = cloneJson(snapshot.customPaths || []);
    pointOverrides = cloneJson(snapshot.pointOverrides || {});
    pathOverrides = cloneJson(snapshot.pathOverrides || {});
    routeSettings = cloneJson(snapshot.routeSettings || {});
    observationAreas = cloneJson(snapshot.observationAreas || []).map(normalizeObservationArea);
    selectedRouteName = typeof snapshot.selectedRouteName === "string" ? snapshot.selectedRouteName : null;
    mergeRouteAName = typeof snapshot.mergeRouteAName === "string" ? snapshot.mergeRouteAName : null;
    mergeRouteBName = typeof snapshot.mergeRouteBName === "string" ? snapshot.mergeRouteBName : null;
    latestMergedRouteName = typeof snapshot.latestMergedRouteName === "string" ? snapshot.latestMergedRouteName : null;
    selectedPointId = typeof snapshot.selectedPointId === "string" ? snapshot.selectedPointId : null;
    selectedPathId = typeof snapshot.selectedPathId === "string" ? snapshot.selectedPathId : null;
    selectedObservationAreaId = typeof snapshot.selectedObservationAreaId === "string" ? snapshot.selectedObservationAreaId : null;
    addPointMode = snapshot.addPointMode === true;
    observationAreaDrawMode = snapshot.observationAreaDrawMode === true;
    drawPathMode = snapshot.drawPathMode === true;
    editPathMode = snapshot.editPathMode === true;
    pathExtendMode = snapshot.pathExtendMode === true;
    selectedPathVertexIndex = Number.isInteger(snapshot.selectedPathVertexIndex) ? snapshot.selectedPathVertexIndex : null;
    relocatePointId = typeof snapshot.relocatePointId === "string" ? snapshot.relocatePointId : null;
    hasClearedSelection = snapshot.hasClearedSelection === true;
    workingPathCoordinates = cloneJson(snapshot.workingPathCoordinates || []);
    workingObservationAreaPoints = cloneJson(snapshot.workingObservationAreaPoints || []);
    latestAnalysisReport = null;
    latestOptimizationPlan = null;
    analysisActive = false;
    shouldFitMapToData = false;

    persistWorkspaceState();
    fileCountEl.textContent = String(uploadedFileSummaries.length);
    renderFileList(uploadedFileSummaries);
    refreshUI();

    if (mapReady && map && snapshot.mapView) {
      map.setLevel(snapshot.mapView.level);
      map.setCenter(new window.kakao.maps.LatLng(snapshot.mapView.lat, snapshot.mapView.lng));
    }

    isRestoringUndo = false;
  }

  function handleUndo() {
    const entry = undoHistory.pop();
    if (!entry) {
      setStatus("되돌릴 작업이 없습니다.", true);
      return;
    }

    restoreUndoSnapshot(entry.snapshot);
    setStatus("직전 작업을 되돌렸습니다.", false);
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  }

  function addHighlightedRoute(routeName) {
    const normalizedRouteName = normalizeRouteName(routeName);
    if (!normalizedRouteName) {
      return;
    }
    if (!highlightedRouteNames.includes(normalizedRouteName)) {
      highlightedRouteNames = [...highlightedRouteNames, normalizedRouteName];
    }
  }

  function clearHighlightedRoutes() {
    highlightedRouteNames = [];
  }

  function syncHighlightedRoutes() {
    const routes = getRoutes();
    highlightedRouteNames = highlightedRouteNames.filter((routeName) => routes.includes(routeName));
  }

  function normalizeSearchText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function syncOptimizationFeatureVisibility() {
    if (!optimizeRoutesButtonEl) {
      return;
    }
    optimizeRoutesButtonEl.hidden = !OPTIMIZATION_FEATURE_ENABLED;
    optimizeRoutesButtonEl.setAttribute("aria-hidden", OPTIMIZATION_FEATURE_ENABLED ? "false" : "true");
    optimizeRoutesButtonEl.disabled = !OPTIMIZATION_FEATURE_ENABLED;
  }

  function ensureSaveDesignedPathButton() {
    if (saveDesignedPathButtonEl || !resetVillageBusRouteButtonEl?.parentElement) {
      return;
    }

    const button = document.createElement("button");
    button.id = "save-designed-path-button";
    button.type = "button";
    button.className = "secondary-button sky-button";
    button.textContent = "경로 저장";
    resetVillageBusRouteButtonEl.insertAdjacentElement("afterend", button);
    saveDesignedPathButtonEl = button;
  }

  function saveRouteListTitles() {
    window.localStorage.setItem(ROUTE_LIST_TITLES_KEY, JSON.stringify(routeListTitles));
  }

  function ensureRouteListTitleInput(listEl, groupKey, fallbackTitle) {
    if (!listEl?.parentElement) {
      return;
    }

    const sectionEl = listEl.parentElement;
    let titleRowEl = sectionEl.querySelector(`.route-list-title-row[data-group="${groupKey}"]`);
    if (!titleRowEl) {
      titleRowEl = document.createElement("div");
      titleRowEl.className = "route-list-title-row";
      titleRowEl.dataset.group = groupKey;
      sectionEl.insertBefore(titleRowEl, listEl);
    }

    let inputEl = titleRowEl.querySelector(`.route-list-title-input[data-group="${groupKey}"]`);

    if (!inputEl) {
      inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.className = "route-list-title-input";
      inputEl.dataset.group = groupKey;
      inputEl.placeholder = fallbackTitle;
      inputEl.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          inputEl.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          inputEl.value = routeListTitles[groupKey] || fallbackTitle;
          inputEl.blur();
        }
      });
      inputEl.addEventListener("blur", () => {
        const nextTitle = String(inputEl.value || "").trim() || fallbackTitle;
        if (routeListTitles[groupKey] === nextTitle) {
          inputEl.value = nextTitle;
          return;
        }
        routeListTitles[groupKey] = nextTitle;
        saveRouteListTitles();
        inputEl.value = nextTitle;
        setStatus(`목록 제목을 "${nextTitle}" 로 변경했습니다.`, false);
      });
      titleRowEl.appendChild(inputEl);
    }

    inputEl.value = routeListTitles[groupKey] || fallbackTitle;

    let analyzeButtonEl = titleRowEl.querySelector(`.list-analyze-button[data-group="${groupKey}"]`);
    if (!analyzeButtonEl) {
      analyzeButtonEl = document.createElement("button");
      analyzeButtonEl.type = "button";
      analyzeButtonEl.className = "secondary-button list-analyze-button";
      analyzeButtonEl.dataset.group = groupKey;
      analyzeButtonEl.textContent = "분석 시작";
      analyzeButtonEl.addEventListener("click", () => {
        handleAnalyzeRouteGroup(groupKey, analyzeButtonEl);
      });
      titleRowEl.appendChild(analyzeButtonEl);
    }

    routeListAnalyzeButtons[groupKey] = analyzeButtonEl;
    updateAnalyzeButtonState();
  }

  function ensureRouteListSearchInput(listEl, groupKey) {
    if (!listEl?.parentElement) {
      return;
    }

    const sectionEl = listEl.parentElement;
    let inputEl = sectionEl.querySelector(`.list-search-input[data-search-group="${groupKey}"]`);
    if (!inputEl) {
      inputEl = document.createElement("input");
      inputEl.type = "search";
      inputEl.className = "list-search-input";
      inputEl.dataset.searchGroup = groupKey;
      inputEl.placeholder = "노선 이름 검색";
      inputEl.addEventListener("input", () => {
        routeListSearchQueries[groupKey] = inputEl.value;
        renderRouteList();
      });
      sectionEl.insertBefore(inputEl, listEl);
    }

    inputEl.value = routeListSearchQueries[groupKey] || "";
  }

  function ensurePointListSearchInput() {
    if (!routePointListEl?.parentElement) {
      return;
    }

    const sectionEl = routePointListEl.parentElement;
    let inputEl = sectionEl.querySelector('.list-search-input[data-search-group="points"]');
    if (!inputEl) {
      inputEl = document.createElement("input");
      inputEl.type = "search";
      inputEl.className = "list-search-input";
      inputEl.dataset.searchGroup = "points";
      inputEl.placeholder = "정류장 이름 검색";
      inputEl.addEventListener("input", () => {
        pointListSearchQuery = inputEl.value;
        renderRoutePointList();
      });
      sectionEl.insertBefore(inputEl, routePointListEl);
    }

    inputEl.value = pointListSearchQuery;
  }

  function getRouteNamesByGroup(groupKey) {
    return getRoutes().filter((routeName) => (
      groupKey === "merged"
        ? getRouteSetting(routeName).routeGroup === "merged"
        : getRouteSetting(routeName).routeGroup !== "merged"
    ));
  }

  function syncStatLabels() {
    const statLabels = document.querySelectorAll(".stats .stat-label");
    if (statLabels[0]) {
      statLabels[0].textContent = "노선수";
    }
    if (statLabels[1]) {
      statLabels[1].textContent = "정류장";
    }
  }

  function syncSectionTitles() {
    const appTitle = document.querySelector(".panel > h1");
    const fileToolsTitle = document.querySelector(".file-tools-section .section-title");
    const routeToolsTitle = document.querySelector(".route-tools-section .section-title");
    const routeDesignTitle = document.querySelector("#village-bus-design-panel .tool-panel-title");

    if (appTitle) {
      appTitle.textContent = "WONDER Linx";
    }

    if (fileToolsTitle) {
      fileToolsTitle.innerHTML = "<span>노선</span><span>저장</span>";
      fileToolsTitle.classList.add("section-title-accent");
    }

    if (routeToolsTitle) {
      routeToolsTitle.innerHTML = "<span>노선/정류장</span><span>수정</span>";
      routeToolsTitle.classList.add("section-title-accent");
    }

    if (routeDesignTitle) {
      routeDesignTitle.textContent = "경로 설계";
    }
  }

  function updateAnalyzeButtonState() {
    if (!analyzeRoutesButtonEl) {
      return;
    }
    analyzeRoutesButtonEl.textContent = analysisActive ? "분석 종료" : "분석 시작";
    analyzeRoutesButtonEl.hidden = true;
    analyzeRoutesButtonEl.setAttribute("aria-hidden", "true");
    Object.entries(routeListAnalyzeButtons).forEach(([groupKey, buttonEl]) => {
      if (!buttonEl) {
        return;
      }
      const isActiveGroup = analysisActive && activeAnalysisGroup === groupKey;
      buttonEl.textContent = isActiveGroup ? "분석 종료" : "분석 시작";
      buttonEl.classList.toggle("is-active", isActiveGroup);
    });
  }

  function updatePointModeButtons() {
    addPointButtonEl.classList.toggle("is-active", addPointMode);
    editPointButtonEl.classList.toggle("is-active", Boolean(relocatePointId));
    addPointButtonEl.textContent = addPointMode
      ? "\uC815\uB958\uC7A5 \uCD94\uAC00 \uC885\uB8CC"
      : "\uC815\uB958\uC7A5 \uCD94\uAC00";
    editPointButtonEl.textContent = relocatePointId
      ? "\uC815\uB958\uC7A5 \uC218\uC815 \uC885\uB8CC"
      : "\uC815\uB958\uC7A5 \uC218\uC815";
  }

  function updateObservationAreaButtons() {
    if (!startObservationAreaButtonEl || !saveObservationAreaButtonEl || !cancelObservationAreaButtonEl) {
      return;
    }
    const selectedArea = observationAreas.find((area) => area.id === selectedObservationAreaId) || null;
    startObservationAreaButtonEl.classList.toggle("is-active", observationAreaDrawMode);
    startObservationAreaButtonEl.textContent = observationAreaDrawMode ? "구역 표시 중" : "구역 그리기";
    updateObservationAreaButtonEl.disabled = !selectedArea || observationAreaDrawMode;
    moveObservationAreaButtonEl.disabled = !selectedArea || observationAreaDrawMode;
    editObservationAreaButtonEl.disabled = !selectedArea || observationAreaDrawMode;
    moveObservationAreaButtonEl.classList.toggle("is-active", observationAreaMoveMode);
    editObservationAreaButtonEl.classList.toggle("is-active", observationAreaEditMode);
    moveObservationAreaButtonEl.textContent = observationAreaMoveMode ? "이동 위치 선택 중" : "구역 이동";
    editObservationAreaButtonEl.textContent = observationAreaEditMode ? "수정 종료" : "구역 수정";
    saveObservationAreaButtonEl.disabled = !observationAreaDrawMode || workingObservationAreaPoints.length < 3;
    cancelObservationAreaButtonEl.disabled = !observationAreaDrawMode;
  }

  function renderObservationAreaPanel() {
    if (!observationAreaListEl || !observationAreaNameEl || !observationAreaColorEl) {
      return;
    }

    const selectedArea = observationAreas.find((area) => area.id === selectedObservationAreaId) || null;
    const canEditFields = observationAreaDrawMode || Boolean(selectedArea);
    observationAreaNameEl.disabled = !canEditFields;
    observationAreaColorEl.disabled = !canEditFields;
    if (observationAreaDrawMode) {
      if (!observationAreaNameEl.value.trim()) {
        observationAreaNameEl.value = `관찰 구역 ${observationAreas.length + 1}`;
      }
    } else if (selectedArea) {
      observationAreaNameEl.value = selectedArea.name;
      observationAreaColorEl.value = normalizeHexColor(selectedArea.color, "#2f8cff");
    } else {
      observationAreaNameEl.value = "";
      observationAreaColorEl.value = "#2f8cff";
    }
    updateObservationAreaButtons();

    observationAreaListEl.innerHTML = "";
    if (!observationAreas.length) {
      observationAreaListEl.innerHTML = '<div class="observation-area-empty">저장된 관찰 구역이 없습니다. 구역 그리기로 새 구역을 만들어 보세요.</div>';
      return;
    }

    observationAreas.forEach((area) => {
      const itemEl = document.createElement("div");
      itemEl.className = "observation-area-item";
      if (area.id === selectedObservationAreaId) {
        itemEl.classList.add("is-selected");
      }
      itemEl.style.setProperty("--area-color", normalizeHexColor(area.color, "#2f8cff"));
      itemEl.addEventListener("click", () => {
        selectedObservationAreaId = area.id;
        refreshUI();
        setStatus(`"${area.name}" 구역을 선택했습니다.`, false);
      });
      const metaEl = document.createElement("div");
      metaEl.innerHTML = `<strong>${escapeHtml(area.name)}</strong><span>꼭짓점 ${area.points.length}개</span>`;

      const actionsEl = document.createElement("div");
      actionsEl.className = "observation-area-actions";

      const hiddenLabel = document.createElement("label");
      const hiddenCheckbox = document.createElement("input");
      hiddenCheckbox.type = "checkbox";
      hiddenCheckbox.checked = area.hidden === true;
      hiddenCheckbox.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      hiddenCheckbox.addEventListener("change", (event) => {
        event.stopPropagation();
        setObservationAreaHidden(area.id, hiddenCheckbox.checked);
      });
      const hiddenText = document.createElement("span");
      hiddenText.textContent = "숨김";
      hiddenLabel.appendChild(hiddenCheckbox);
      hiddenLabel.appendChild(hiddenText);

      const focusButton = document.createElement("button");
      focusButton.type = "button";
      focusButton.className = "observation-area-chip";
      focusButton.textContent = "보기";
      focusButton.addEventListener("click", (event) => {
        event.stopPropagation();
        focusObservationArea(area.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "observation-area-chip";
      deleteButton.textContent = "삭제";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeObservationArea(area.id);
      });

      actionsEl.appendChild(hiddenLabel);
      actionsEl.appendChild(focusButton);
      actionsEl.appendChild(deleteButton);
      itemEl.appendChild(metaEl);
      itemEl.appendChild(actionsEl);
      observationAreaListEl.appendChild(itemEl);
    });
  }

  function stopObservationAreaDrawMode() {
    observationAreaDrawMode = false;
    observationAreaMoveMode = false;
    observationAreaEditMode = false;
    observationAreaDragState = null;
    workingObservationAreaPoints = [];
    if (observationAreaNameEl) {
      observationAreaNameEl.value = "";
    }
    if (observationAreaColorEl) {
      observationAreaColorEl.value = "#2f8cff";
    }
    updateObservationAreaButtons();
  }

  function startObservationAreaDrawMode() {
    stopPathModes();
    stopRelocateMode();
    setAddPointMode(false);
    observationAreaDrawMode = true;
    observationAreaMoveMode = false;
    observationAreaEditMode = false;
    workingObservationAreaPoints = [];
    renderObservationAreas();
    renderObservationAreaPanel();
    setStatus("관찰 구역 그리기 모드입니다. 지도에서 꼭짓점을 차례대로 클릭한 뒤 구역 저장을 누르세요.", false);
  }

  function updateObservationArea(areaId, updater, options = {}) {
    const { persist = true } = options;
    const index = observationAreas.findIndex((area) => area.id === areaId);
    if (index < 0) {
      return null;
    }
    const current = normalizeObservationArea(observationAreas[index]);
    const next = normalizeObservationArea(updater(current) || current);
    observationAreas[index] = next;
    if (persist) {
      saveObservationAreas();
    }
    return next;
  }

  function setObservationAreaHidden(areaId, hidden) {
    pushUndoSnapshot();
    const updated = updateObservationArea(areaId, (area) => ({
      ...area,
      hidden,
    }));
    if (!updated) {
      return;
    }
    if (hidden && selectedObservationAreaId === areaId) {
      selectedObservationAreaId = areaId;
    }
    refreshUI();
    setStatus(`"${updated.name}" 구역을 ${hidden ? "숨김" : "표시"} 상태로 변경했습니다.`, false);
  }

  function updateSelectedObservationAreaSettings() {
    const selectedArea = observationAreas.find((area) => area.id === selectedObservationAreaId);
    if (!selectedArea) {
      setStatus("수정할 관찰 구역을 먼저 선택하세요.", true);
      return;
    }
    pushUndoSnapshot();
    const updated = updateObservationArea(selectedArea.id, (area) => ({
      ...area,
      name: String(observationAreaNameEl?.value || "").trim() || area.name,
      color: normalizeHexColor(observationAreaColorEl?.value, area.color),
    }));
    if (!updated) {
      return;
    }
    refreshUI();
    setStatus(`"${updated.name}" 구역 설정을 저장했습니다.`, false);
  }

  function updateObservationAreaVertex(areaId, pointIndex, lat, lng) {
    const updated = updateObservationArea(areaId, (area) => ({
      ...area,
      points: area.points.map((point, index) => (
        index === pointIndex ? { lat, lng } : point
      )),
    }));
    if (!updated) {
      return;
    }
    refreshUI();
    setStatus(`"${updated.name}" 구역 꼭짓점을 수정했습니다.`, false);
  }

  function deleteObservationAreaVertex(areaId, pointIndex) {
    const area = observationAreas.find((item) => item.id === areaId);
    if (!area) {
      return;
    }
    if (area.points.length <= 3) {
      setStatus("관찰 구역은 최소 3개의 포인트가 필요합니다.", true);
      return;
    }
    pushUndoSnapshot();
    const updated = updateObservationArea(areaId, (currentArea) => ({
      ...currentArea,
      points: currentArea.points.filter((point, index) => index !== pointIndex),
    }));
    if (!updated) {
      return;
    }
    refreshUI();
    setStatus(`"${updated.name}" 구역 포인트를 삭제했습니다.`, false);
  }

  function insertObservationAreaVertex(areaId, pointIndex) {
    const area = observationAreas.find((item) => item.id === areaId);
    if (!area || area.points.length < 2) {
      return;
    }
    const currentPoint = area.points[pointIndex];
    const nextPoint = area.points[(pointIndex + 1) % area.points.length];
    if (!currentPoint || !nextPoint) {
      return;
    }
    const newPoint = {
      lat: Number(((currentPoint.lat + nextPoint.lat) / 2).toFixed(7)),
      lng: Number(((currentPoint.lng + nextPoint.lng) / 2).toFixed(7)),
    };
    pushUndoSnapshot();
    const updated = updateObservationArea(areaId, (currentArea) => {
      const nextPoints = currentArea.points.map((point) => ({ ...point }));
      nextPoints.splice(pointIndex + 1, 0, newPoint);
      return {
        ...currentArea,
        points: nextPoints,
      };
    });
    if (!updated) {
      return;
    }
    refreshUI();
    setStatus(`"${updated.name}" 구역에 새 포인트를 추가했습니다.`, false);
  }

  function toggleObservationAreaEditMode() {
    const selectedArea = observationAreas.find((area) => area.id === selectedObservationAreaId);
    if (!selectedArea) {
      setStatus("수정할 관찰 구역을 먼저 선택하세요.", true);
      return;
    }
    observationAreaMoveMode = false;
    observationAreaEditMode = !observationAreaEditMode;
    refreshUI();
    setStatus(
      observationAreaEditMode
        ? `"${selectedArea.name}" 구역 수정 모드입니다. 지도 위 꼭짓점을 드래그해 형태를 조정하세요.`
        : "관찰 구역 수정 모드를 종료했습니다.",
      false
    );
  }

  function toggleObservationAreaMoveMode() {
    const selectedArea = observationAreas.find((area) => area.id === selectedObservationAreaId);
    if (!selectedArea) {
      setStatus("이동할 관찰 구역을 먼저 선택하세요.", true);
      return;
    }
    observationAreaEditMode = false;
    observationAreaMoveMode = !observationAreaMoveMode;
    refreshUI();
    setStatus(
      observationAreaMoveMode
        ? `"${selectedArea.name}" 구역 이동 모드입니다. 지도 위 구역을 마우스로 잡고 드래그하세요.`
        : "관찰 구역 이동 모드를 종료했습니다.",
      false
    );
  }

  function saveObservationAreaDraft() {
    if (!observationAreaDrawMode || workingObservationAreaPoints.length < 3) {
      setStatus("관찰 구역을 저장하려면 꼭짓점이 3개 이상 필요합니다.", true);
      return;
    }

    const areaName = String(observationAreaNameEl?.value || "").trim() || `관찰 구역 ${observationAreas.length + 1}`;
    const areaColor = normalizeHexColor(observationAreaColorEl?.value, "#2f8cff");
    pushUndoSnapshot();
    observationAreas = observationAreas.concat([
      normalizeObservationArea({
        id: `observation-${Date.now()}`,
        name: areaName,
        color: areaColor,
        hidden: false,
        points: workingObservationAreaPoints,
        createdAt: new Date().toISOString(),
      }),
    ]);
    selectedObservationAreaId = observationAreas[observationAreas.length - 1].id;
    saveObservationAreas();
    stopObservationAreaDrawMode();
    refreshUI();
    setStatus(`"${areaName}" 관찰 구역을 저장했습니다.`, false);
  }

  function focusObservationArea(areaId) {
    const area = observationAreas.find((item) => item.id === areaId);
    if (!area || !mapReady || !map || area.points.length < 3) {
      return;
    }
    selectedObservationAreaId = area.id;
    const bounds = new window.kakao.maps.LatLngBounds();
    area.points.forEach((point) => {
      bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng));
    });
    map.setBounds(bounds);
    refreshUI();
    setStatus(`"${area.name}" 구역으로 지도를 이동했습니다.`, false);
  }

  function removeObservationArea(areaId) {
    const area = observationAreas.find((item) => item.id === areaId);
    if (!area) {
      return;
    }
    if (!window.confirm(`"${area.name}" 관찰 구역을 삭제하시겠습니까?`)) {
      return;
    }
    pushUndoSnapshot();
    observationAreas = observationAreas.filter((item) => item.id !== areaId);
    if (selectedObservationAreaId === areaId) {
      selectedObservationAreaId = null;
    }
    saveObservationAreas();
    refreshUI();
    setStatus(`"${area.name}" 관찰 구역을 삭제했습니다.`, false);
  }

  function setCollapsibleSectionExpanded(sectionEl, toggleEl, expanded) {
    if (!sectionEl || !toggleEl) {
      return;
    }
    sectionEl.classList.toggle("is-collapsed", !expanded);
    toggleEl.setAttribute("aria-expanded", expanded ? "true" : "false");
    const indicator = toggleEl.querySelector(".section-toggle-indicator");
    if (indicator) {
      indicator.textContent = expanded ? "\uB2EB\uAE30" : "\uC5F4\uAE30";
    }
  }

  function toggleCollapsibleSection(sectionEl, toggleEl) {
    const expanded = sectionEl.classList.contains("is-collapsed");
    setCollapsibleSectionExpanded(sectionEl, toggleEl, expanded);
  }

  function setToolPanelExpanded(panelEl, expanded) {
    if (!panelEl) {
      return;
    }
    panelEl.classList.toggle("is-collapsed", !expanded);
    const toggleButton = panelEl.querySelector(".tool-panel-toggle");
    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggleButton.textContent = expanded ? "닫기" : "열기";
    }
  }

  function bindCollapsibleToolPanels() {
    document.querySelectorAll('.tool-panel[data-collapsible="true"]').forEach((panelEl) => {
      const toggleButton = panelEl.querySelector(".tool-panel-toggle");
      if (!toggleButton || toggleButton.dataset.bound === "true") {
        return;
      }
      toggleButton.dataset.bound = "true";
      setToolPanelExpanded(panelEl, !panelEl.classList.contains("is-collapsed"));
      toggleButton.addEventListener("click", () => {
        const expanded = panelEl.classList.contains("is-collapsed");
        setToolPanelExpanded(panelEl, expanded);
      });
    });
  }

  function openPointDetailsSection() {
    setCollapsibleSectionExpanded(pointDetailsSectionEl, pointDetailsToggleEl, true);
  }

  function openPointFormSection() {
    setCollapsibleSectionExpanded(pointFormSectionEl, pointFormToggleEl, true);
  }

  function setEmptyDetails() {
    pointDetailsEl.classList.add("empty");
    pointDetailsEl.innerHTML = '<p class="details-empty">노선과 정류장을 선택하세요.</p>';
  }

  function loadJsonArray(key) {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function loadJsonObject(key) {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveCustomPoints() {
    window.localStorage.setItem(CUSTOM_POINTS_KEY, JSON.stringify(customPoints));
    scheduleAutoSaveKml();
  }

  function saveCustomPaths() {
    window.localStorage.setItem(CUSTOM_PATHS_KEY, JSON.stringify(customPaths));
    scheduleAutoSaveKml();
  }

  function saveOverrides() {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(pointOverrides));
    scheduleAutoSaveKml();
  }

  function savePathOverrides() {
    window.localStorage.setItem(PATH_OVERRIDES_KEY, JSON.stringify(pathOverrides));
    scheduleAutoSaveKml();
  }

  function saveRouteSettings() {
    window.localStorage.setItem(ROUTE_SETTINGS_KEY, JSON.stringify(routeSettings));
  }

  function saveUploadedWorkspace() {
    window.localStorage.setItem(UPLOADED_POINTS_KEY, JSON.stringify(uploadedPoints));
    window.localStorage.setItem(UPLOADED_PATHS_KEY, JSON.stringify(uploadedPaths));
    window.localStorage.setItem(UPLOADED_FILE_SUMMARIES_KEY, JSON.stringify(uploadedFileSummaries));
  }

  function saveObservationAreas() {
    window.localStorage.setItem(OBSERVATION_AREAS_KEY, JSON.stringify(observationAreas));
  }

  function saveUiState() {
    window.localStorage.setItem(
      UI_STATE_KEY,
      JSON.stringify({
        selectedRouteName,
        selectedPointId,
        selectedPathId,
      })
    );
  }

  function normalizeExtendedData(value) {
    return Array.isArray(value)
      ? value.map((item) => ({
          name: String(item?.name || "value"),
          value: String(item?.value || ""),
        }))
      : [];
  }

  function getRidershipFromExtendedData(value) {
    const extendedData = normalizeExtendedData(value);
    const keys = ["ridership", "boardingCount", "passengerCount", "탑승객 수", "탑승객수"];
    for (const key of keys) {
      const ridership = normalizeRidershipValue(getExtendedDataValue(extendedData, key));
      if (ridership != null) {
        return ridership;
      }
    }
    return null;
  }

  function withRidershipExtendedData(value, ridership) {
    const normalizedRidership = normalizeRidershipValue(ridership);
    const excludedNames = new Set(["ridership", "boardingCount", "passengerCount", "탑승객 수", "탑승객수"]);
    const next = normalizeExtendedData(value).filter((item) => !excludedNames.has(String(item.name || "").trim()));
    if (normalizedRidership != null) {
      next.push({
        name: "ridership",
        value: String(normalizedRidership),
      });
    }
    return next;
  }

  function normalizeObservationArea(area) {
    const points = Array.isArray(area?.points)
      ? area.points
          .map((point) => ({
            lat: Number(point?.lat),
            lng: Number(point?.lng),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [];

    return {
      id: String(area?.id || `observation-${Date.now()}`),
      fileName: area?.fileName ? String(area.fileName) : "",
      name: String(area?.name || "관찰 구역").trim() || "관찰 구역",
      color: normalizeHexColor(area?.color, "#2f8cff"),
      hidden: area?.hidden === true,
      points,
      createdAt: typeof area?.createdAt === "string" ? area.createdAt : new Date().toISOString(),
    };
  }

  function normalizeRouteName(value) {
    return String(value || "").trim() || DEFAULT_ROUTE_NAME;
  }

  function colorFromRouteName(routeName) {
    const palette = [
      "#0f6cbd",
      "#bf5b2c",
      "#2f855a",
      "#8b5cf6",
      "#d97706",
      "#dc2626",
      "#0284c7",
      "#7c3aed",
    ];
    let hash = 0;
    for (const char of routeName) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  function getDefaultVillageBusDesignSettings() {
    return {
      priority: "RECOMMEND",
      avoid: [],
      roadevent: 1,
      alternatives: false,
      roadDetails: false,
      carType: 3,
      carFuel: "",
      carHipass: false,
    };
  }

  function normalizeVillageBusDesignSettings(value) {
    const defaults = getDefaultVillageBusDesignSettings();
    const current = value && typeof value === "object" ? value : {};
    const allowedAvoids = ["motorway", "toll", "uturn", "schoolzone", "ferries"];
    const avoid = Array.isArray(current.avoid)
      ? current.avoid.filter((item, index, array) => allowedAvoids.includes(item) && array.indexOf(item) === index)
      : defaults.avoid;
    const priority = ["RECOMMEND", "TIME", "DISTANCE"].includes(current.priority) ? current.priority : defaults.priority;
    const roadevent = [0, 1, 2].includes(Number(current.roadevent)) ? Number(current.roadevent) : defaults.roadevent;
    const carType = 3;
    const carFuel = "";

    return {
      priority,
      avoid: [],
      roadevent,
      alternatives: false,
      roadDetails: false,
      carType,
      carFuel,
      carHipass: false,
    };
  }

  function getRouteSetting(routeName) {
    const normalizedRouteName = normalizeRouteName(routeName);
    const current = routeSettings[normalizedRouteName] || {};
    const defaultGroup = isMergedRouteName(normalizedRouteName) ? "merged" : "default";
    const routeGroup = current.routeGroup === "merged" || current.routeGroup === "default"
      ? current.routeGroup
      : defaultGroup;
    return {
      color: current.color || colorFromRouteName(normalizedRouteName),
      visible: current.visible !== false,
      deleted: current.deleted === true,
      routeGroup,
      routeOrder: Number.isFinite(Number(current.routeOrder)) ? Number(current.routeOrder) : null,
      villageBusDesign: normalizeVillageBusDesignSettings(current.villageBusDesign),
    };
  }

  function ensureRouteSettings() {
    let changed = false;
    getRoutes().forEach((routeName, index) => {
      if (!routeSettings[routeName]) {
        routeSettings[routeName] = getRouteSetting(routeName);
        changed = true;
      }
      if (!Number.isFinite(Number(getRouteSetting(routeName).routeOrder))) {
        routeSettings[routeName] = {
          ...getRouteSetting(routeName),
          routeOrder: index + 1,
        };
        changed = true;
      }
    });

    if (changed) {
      saveRouteSettings();
    }
  }

  function isRouteVisible(routeName) {
    return getRouteSetting(routeName).visible;
  }

  function isRouteDeleted(routeName) {
    return getRouteSetting(routeName).deleted;
  }

  function normalizeCustomPoint(point) {
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    const extendedData = normalizeExtendedData(point.extendedData);
    const ridership = normalizeRidershipValue(
      point.ridership != null ? point.ridership : getRidershipFromExtendedData(extendedData)
    );

    return {
      id: String(point.id),
      source: "custom",
      createdOrder: Number.isFinite(Number(point.createdOrder))
        ? Number(point.createdOrder)
        : Number(String(point.id).match(/^custom-(\d+)/)?.[1] || Date.now()),
      routeName: normalizeRouteName(point.routeName),
      fileName: point.fileName || "직접 추가",
      name: point.name || "이름 없음",
      description: point.description || "",
      address: point.address || "",
      phoneNumber: point.phoneNumber || "",
      styleUrl: point.styleUrl || "",
      rawCoordinates: point.rawCoordinates || `${lng},${lat}`,
      lat,
      lng,
      altitude: point.altitude == null || point.altitude === "" ? null : Number(point.altitude),
      ridership,
      extendedData: withRidershipExtendedData(extendedData, ridership),
    };
  }

  function normalizeUploadedPoint(point) {
    const override = pointOverrides[point.id] || {};
    const extendedData = normalizeExtendedData(
      Object.prototype.hasOwnProperty.call(override, "extendedData") ? override.extendedData : point.extendedData
    );
    const ridership = normalizeRidershipValue(
      Object.prototype.hasOwnProperty.call(override, "ridership")
        ? override.ridership
        : (point.ridership != null ? point.ridership : getRidershipFromExtendedData(extendedData))
    );

    return {
      ...point,
      ...override,
      source: "uploaded",
      createdOrder: Number.isFinite(Number(override.createdOrder))
        ? Number(override.createdOrder)
        : (Number.isFinite(Number(point.createdOrder)) ? Number(point.createdOrder) : null),
      routeName: normalizeRouteName(override.routeName || point.routeName || point.fileName),
      ridership,
      extendedData: withRidershipExtendedData(extendedData, ridership),
    };
  }

  function normalizeUploadedPath(pathItem) {
    const override = pathOverrides[pathItem.id] || {};
    return {
      ...pathItem,
      ...override,
      source: "uploaded-path",
      routeName: normalizeRouteName(override.routeName || pathItem.routeName || pathItem.fileName),
      coordinates: Array.isArray(override.coordinates) && override.coordinates.length >= 2
        ? override.coordinates
        : pathItem.coordinates,
      deleted: override.deleted === true,
    };
  }

  function normalizeCustomPath(pathItem) {
    return {
      ...pathItem,
      source: "custom-path",
      routeName: normalizeRouteName(pathItem.routeName),
      fileName: pathItem.fileName || "직접 추가",
      name: pathItem.name || "이름 없는 경로",
      description: pathItem.description || "",
      coordinates: Array.isArray(pathItem.coordinates) ? pathItem.coordinates : [],
      totalDistanceMeters: Number(pathItem.totalDistanceMeters) || 0,
      totalDurationSeconds: Number(pathItem.totalDurationSeconds) || 0,
      designedRoute: pathItem.designedRoute === true,
      deleted: pathItem.deleted === true,
    };
  }

  function getAllPoints() {
    return [...uploadedPoints.map(normalizeUploadedPoint), ...customPoints].filter(
      (point) => !point.deleted && !isRouteDeleted(point.routeName)
    );
  }

  function getPointById(pointId) {
    return getAllPoints().find((point) => point.id === pointId) || null;
  }

  function getUploadedPointSource(pointId) {
    return uploadedPoints.find((point) => point.id === pointId) || null;
  }

  function getAllPaths() {
    return [...uploadedPaths.map(normalizeUploadedPath), ...customPaths.map(normalizeCustomPath)]
      .filter((pathItem) => !pathItem.deleted && !isRouteDeleted(pathItem.routeName));
  }

  function getPathById(pathId) {
    return getAllPaths().find((pathItem) => pathItem.id === pathId) || null;
  }

  function getRoutes() {
    const routeNames = getAllPoints()
      .map((point) => normalizeRouteName(point.routeName))
      .concat(getAllPaths().map((pathItem) => normalizeRouteName(pathItem.routeName)));

    return [...new Set(routeNames)].sort((a, b) => {
      const settingA = getRouteSetting(a);
      const settingB = getRouteSetting(b);
      const orderA = Number.isFinite(Number(settingA.routeOrder)) ? Number(settingA.routeOrder) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(settingB.routeOrder)) ? Number(settingB.routeOrder) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.localeCompare(b, "ko");
    });
  }

  function getPointOrderValue(point) {
    if (Number.isFinite(Number(point.createdOrder))) {
      return Number(point.createdOrder);
    }

    if (point.source === "custom") {
      const customMatch = String(point.id).match(/^custom-(\d+)/);
      if (customMatch) {
        return Number(customMatch[1]);
      }
    }

    const uploadedMatch = String(point.id).match(/-point-(\d+)$/);
    if (uploadedMatch) {
      return Number(uploadedMatch[1]);
    }

    return Number.MAX_SAFE_INTEGER;
  }

  function comparePointsByOrder(a, b) {
    const orderDiff = getPointOrderValue(a) - getPointOrderValue(b);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return String(a.id).localeCompare(String(b.id), "ko");
  }

  function getPointsInSelectedRoute() {
    if (!selectedRouteName) {
      return [];
    }

    return getAllPoints().filter((point) => point.routeName === selectedRouteName).sort(comparePointsByOrder);
  }

  function getPointsInRoute(routeName) {
    if (!routeName) {
      return [];
    }

    return getAllPoints().filter((point) => point.routeName === routeName).sort(comparePointsByOrder);
  }

  function isMergedRouteName(routeName) {
    return String(routeName || "").endsWith(" 병합");
  }

  function renameRoute(oldRouteName, nextRouteName) {
    const previousName = normalizeRouteName(oldRouteName);
    const renamedRouteName = normalizeRouteName(nextRouteName);
    const beforeRoutes = getRoutes();
    const routePoints = getAllPoints().filter((point) => normalizeRouteName(point.routeName) === previousName);
    const routePaths = getAllPaths().filter((pathItem) => normalizeRouteName(pathItem.routeName) === previousName);
    const customPointIds = new Set(routePoints.filter((point) => point.source === "custom").map((point) => point.id));
    const uploadedPointIds = new Set(routePoints.filter((point) => point.source !== "custom").map((point) => point.id));
    const customPathIds = new Set(routePaths.filter((pathItem) => pathItem.source === "custom-path").map((pathItem) => pathItem.id));
    const uploadedPathIds = new Set(routePaths.filter((pathItem) => pathItem.source !== "custom-path").map((pathItem) => pathItem.id));

    if (!previousName || !renamedRouteName) {
      throw new Error("노선명을 입력하세요.");
    }
    if (previousName === renamedRouteName) {
      return renamedRouteName;
    }
    if (getRoutes().includes(renamedRouteName)) {
      throw new Error("같은 이름의 노선이 이미 있습니다.");
    }

    pushUndoSnapshot();
    const previousSetting = getRouteSetting(previousName);
    logRenameRouteDebug("before-rename", {
      previousName,
      renamedRouteName,
      previousSetting,
      selectedRouteName,
      mergeRouteAName,
      mergeRouteBName,
      latestMergedRouteName,
      beforeRoutes,
    });
    customPoints = customPoints.map((point) => (
      customPointIds.has(point.id)
        ? { ...point, routeName: renamedRouteName }
        : point
    ));
    saveCustomPoints();

    uploadedPoints
      .filter((point) => uploadedPointIds.has(point.id))
      .forEach((point) => {
        pointOverrides[point.id] = {
          ...(pointOverrides[point.id] || {}),
          routeName: renamedRouteName,
        };
      });
    saveOverrides();

    customPaths = customPaths.map((pathItem) => (
      customPathIds.has(pathItem.id)
        ? { ...pathItem, routeName: renamedRouteName }
        : pathItem
    ));
    saveCustomPaths();

    uploadedPaths
      .filter((pathItem) => uploadedPathIds.has(pathItem.id))
      .forEach((pathItem) => {
        pathOverrides[pathItem.id] = {
          ...(pathOverrides[pathItem.id] || {}),
          routeName: renamedRouteName,
        };
      });
    savePathOverrides();

    routeSettings[renamedRouteName] = {
      ...previousSetting,
    };
    delete routeSettings[previousName];
    saveRouteSettings();

    if (selectedRouteName === previousName) {
      selectedRouteName = renamedRouteName;
    }
    if (mergeRouteAName === previousName) {
      mergeRouteAName = renamedRouteName;
    }
    if (mergeRouteBName === previousName) {
      mergeRouteBName = renamedRouteName;
    }
    if (latestMergedRouteName === previousName) {
      latestMergedRouteName = renamedRouteName;
    }
    highlightedRouteNames = highlightedRouteNames.map((routeName) => (
      routeName === previousName ? renamedRouteName : routeName
    ));

    logRenameRouteDebug("after-rename", {
      previousName,
      renamedRouteName,
      renamedSetting: routeSettings[renamedRouteName],
      selectedRouteName,
      mergeRouteAName,
      mergeRouteBName,
      latestMergedRouteName,
      afterRoutes: getRoutes(),
      routeGroup: getRouteSetting(renamedRouteName).routeGroup,
      routeOrder: getRouteSetting(renamedRouteName).routeOrder,
      oldPointCount: getAllPoints().filter((point) => normalizeRouteName(point.routeName) === previousName).length,
      newPointCount: getAllPoints().filter((point) => normalizeRouteName(point.routeName) === renamedRouteName).length,
      oldPathCount: getAllPaths().filter((pathItem) => normalizeRouteName(pathItem.routeName) === previousName).length,
      newPathCount: getAllPaths().filter((pathItem) => normalizeRouteName(pathItem.routeName) === renamedRouteName).length,
    });

    return renamedRouteName;
  }

  function renamePoint(pointId, nextPointName) {
    const point = getPointById(pointId);
    const renamedPointName = String(nextPointName || "").trim();

    if (!point) {
      throw new Error("정류장을 찾을 수 없습니다.");
    }
    if (!renamedPointName) {
      throw new Error("정류장명을 입력하세요.");
    }
    if (point.name === renamedPointName) {
      return renamedPointName;
    }

    pushUndoSnapshot();

    if (point.source === "custom") {
      const customIndex = customPoints.findIndex((item) => item.id === point.id);
      if (customIndex >= 0) {
        customPoints[customIndex] = {
          ...customPoints[customIndex],
          name: renamedPointName,
        };
        saveCustomPoints();
      }
      return renamedPointName;
    }

    const current = normalizeUploadedPoint(point);
    pointOverrides[point.id] = {
      routeName: current.routeName,
      name: renamedPointName,
      fileName: current.fileName,
      lat: current.lat,
      lng: current.lng,
      altitude: current.altitude,
      phoneNumber: current.phoneNumber,
      address: current.address,
      description: current.description,
      rawCoordinates: current.rawCoordinates,
      extendedData: current.extendedData,
      createdOrder: current.createdOrder,
    };
    saveOverrides();
    return renamedPointName;
  }

  function ensureSelectedPath() {
    if (selectedPathId && !getPathById(selectedPathId)) {
      selectedPathId = null;
    }
  }

  function ensureSelectedRoute() {
    const routes = getRoutes();
    syncHighlightedRoutes();
    if (!routes.length) {
      selectedRouteName = null;
      clearHighlightedRoutes();
      hasClearedSelection = false;
      return;
    }

    if (hasClearedSelection) {
      selectedRouteName = null;
      clearHighlightedRoutes();
      return;
    }

    if (!selectedRouteName || !routes.includes(selectedRouteName)) {
      selectedRouteName = routes[0];
    }
  }

  function ensureMergeRoutes() {
    const routes = getRoutes();
    if (routes.length < 2) {
      mergeRouteAName = null;
      mergeRouteBName = null;
      return;
    }

    if (!mergeRouteAName || !routes.includes(mergeRouteAName)) {
      mergeRouteAName = selectedRouteName && routes.includes(selectedRouteName) ? selectedRouteName : routes[0];
    }

    if (!mergeRouteBName || !routes.includes(mergeRouteBName) || mergeRouteBName === mergeRouteAName) {
      mergeRouteBName = routes.find((routeName) => routeName !== mergeRouteAName) || null;
    }
  }

  function ensureSelectedPoint() {
    if (addPointMode) {
      return;
    }

    const points = getPointsInSelectedRoute();
    if (!points.length) {
      selectedPointId = null;
      return;
    }

    if (!selectedPointId || !points.some((point) => point.id === selectedPointId)) {
      selectedPointId = points[0].id;
    }
  }

  function updateCounts() {
    const routes = getRoutes();
    const points = getAllPoints();
    const existingRouteCount = routes.filter((routeName) => getRouteSetting(routeName).routeGroup !== "merged").length;
    const newRouteCount = routes.length - existingRouteCount;
    const existingPointCount = points.filter((point) => getRouteSetting(point.routeName).routeGroup !== "merged").length;
    const newPointCount = points.length - existingPointCount;

    fileCountEl.innerHTML = `${routes.length}<small>기존 ${existingRouteCount} / 신규 ${newRouteCount}</small>`;
    pointCountEl.innerHTML = `${points.length}<small>기존 ${existingPointCount} / 신규 ${newPointCount}</small>`;
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function distanceInMeters(a, b) {
    const earthRadius = 6371000;
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const haversine =
      sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function midpointOf(a, b) {
    return {
      lat: (a.lat + b.lat) / 2,
      lng: (a.lng + b.lng) / 2,
    };
  }

  function directionVector(points, index) {
    const current = points[index];
    const prev = points[index - 1] || null;
    const next = points[index + 1] || null;

    if (!current) {
      return null;
    }

    const start = prev || current;
    const end = next || current;
    const dx = Number(end.lng) - Number(start.lng);
    const dy = Number(end.lat) - Number(start.lat);
    const length = Math.hypot(dx, dy);

    if (!Number.isFinite(length) || length === 0) {
      return null;
    }

    return {
      dx: dx / length,
      dy: dy / length,
    };
  }

  function directionSimilarity(pointsA, indexA, pointsB, indexB) {
    const vectorA = directionVector(pointsA, indexA);
    const vectorB = directionVector(pointsB, indexB);

    if (!vectorA || !vectorB) {
      return 0;
    }

    return vectorA.dx * vectorB.dx + vectorA.dy * vectorB.dy;
  }

  function formatDistanceKm(distanceMeters) {
    return (Number(distanceMeters || 0) / 1000).toFixed(1);
  }

  function formatDurationMinutes(durationSeconds) {
    return Math.round(Number(durationSeconds || 0) / 60);
  }

  function formatPercent(value, digits = 1) {
    return `${(Number(value || 0) * 100).toFixed(digits)}%`;
  }

  function formatAreaSquareKm(value) {
    return `${(Number(value || 0)).toFixed(2)}km²`;
  }

  function calculateChangeRate(beforeValue, afterValue, mode = "decrease-good") {
    const before = Number(beforeValue || 0);
    const after = Number(afterValue || 0);
    if (before <= 0) {
      return 0;
    }
    if (mode === "increase-good") {
      return (after - before) / before;
    }
    return (before - after) / before;
  }

  function calculatePathDistanceMeters(pathItem) {
    const coordinates = Array.isArray(pathItem?.coordinates) ? pathItem.coordinates : [];
    if (coordinates.length < 2) {
      return 0;
    }

    let total = 0;
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      total += segmentLengthMeters(coordinates[index], coordinates[index + 1]);
    }
    return total;
  }

  function formatPathDuration(pathItem) {
    const totalDurationSeconds = Number(pathItem?.totalDurationSeconds || pathItem?.estimatedDurationSeconds) || 0;
    return totalDurationSeconds > 0 ? `${formatDurationMinutes(totalDurationSeconds)}분` : "-";
  }

  function getDuplicateGroupVisual(groupSize) {
    if (groupSize >= 5) {
      return { stroke: "#dc2626", fill: "#fecaca" };
    }
    if (groupSize === 4) {
      return { stroke: "#2563eb", fill: "#bfdbfe" };
    }
    if (groupSize === 3) {
      return { stroke: "#16a34a", fill: "#bbf7d0" };
    }
    return { stroke: "#eab308", fill: "#fef08a" };
  }

  function averagePoint(points) {
    if (!points.length) {
      return { lat: 0, lng: 0 };
    }

    const sum = points.reduce(
      (acc, point) => ({
        lat: acc.lat + point.lat,
        lng: acc.lng + point.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / points.length,
      lng: sum.lng / points.length,
    };
  }

  function segmentLengthMeters(start, end) {
    return distanceInMeters(start, end);
  }

  function projectCoordinateForDistance(coordinate, originLat) {
    const latFactor = 111320;
    const lngFactor = Math.cos(toRadians(originLat || coordinate.lat || 0)) * 111320;
    return {
      x: Number(coordinate.lng) * lngFactor,
      y: Number(coordinate.lat) * latFactor,
    };
  }

  function pointToSegmentMetrics(point, start, end) {
    const projectedPoint = projectCoordinateForDistance(point, point.lat);
    const projectedStart = projectCoordinateForDistance(start, point.lat);
    const projectedEnd = projectCoordinateForDistance(end, point.lat);
    const dx = projectedEnd.x - projectedStart.x;
    const dy = projectedEnd.y - projectedStart.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((projectedPoint.x - projectedStart.x) * dx + (projectedPoint.y - projectedStart.y) * dy) / lengthSquared
          )
        );
    const nearest = {
      x: projectedStart.x + dx * t,
      y: projectedStart.y + dy * t,
    };
    const offsetX = projectedPoint.x - nearest.x;
    const offsetY = projectedPoint.y - nearest.y;
    const cross = dx * (projectedPoint.y - projectedStart.y) - dy * (projectedPoint.x - projectedStart.x);
    return {
      distanceMeters: Math.sqrt(offsetX * offsetX + offsetY * offsetY),
      cross,
      t,
    };
  }

  function inferPointTravelSide(point) {
    const candidatePaths = getAllPaths().filter(
      (pathItem) => pathItem.routeName === point.routeName && Array.isArray(pathItem.coordinates) && pathItem.coordinates.length >= 2
    );
    let bestMatch = null;

    candidatePaths.forEach((pathItem) => {
      for (let index = 0; index < pathItem.coordinates.length - 1; index += 1) {
        const start = pathItem.coordinates[index];
        const end = pathItem.coordinates[index + 1];
        const metrics = pointToSegmentMetrics(point, start, end);
        if (!bestMatch || metrics.distanceMeters < bestMatch.distanceMeters) {
          bestMatch = {
            ...metrics,
            routeName: pathItem.routeName,
          };
        }
      }
    });

    if (!bestMatch || bestMatch.distanceMeters > 80) {
      return "unknown";
    }

    if (Math.abs(bestMatch.cross) < 1) {
      return "unknown";
    }

    return bestMatch.cross < 0 ? "right" : "left";
  }

  function interpolateCoordinate(start, end, ratio) {
    return {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
  }

  function bearingDegrees(start, end) {
    return (Math.atan2(end.lat - start.lat, end.lng - start.lng) * 180) / Math.PI;
  }

  function buildAnalysisDataset(routeNames = getRoutes()) {
    const routeNameSet = new Set(routeNames);
    const points = getAllPoints().filter((point) => routeNameSet.has(point.routeName));
    const paths = getAllPaths().filter((pathItem) => routeNameSet.has(pathItem.routeName));

    return {
      routes: routeNames.map((routeName) => ({
        routeName,
        points: points
          .filter((point) => point.routeName === routeName)
          .map((point) => ({
            id: point.id,
            name: point.name,
            lat: point.lat,
            lng: point.lng,
          })),
        paths: paths
          .filter((pathItem) => pathItem.routeName === routeName)
          .map((pathItem) => ({
            id: pathItem.id,
            name: pathItem.name,
            coordinates: pathItem.coordinates.map((coordinate) => ({
              lat: coordinate.lat,
              lng: coordinate.lng,
            })),
          })),
      })),
    };
  }

  function detectDuplicatePoints(thresholdMeters = 30, routeNames = getRoutes()) {
    const routeNameSet = new Set(routeNames);
    const points = getAllPoints().filter((point) => routeNameSet.has(point.routeName));
    const pointMap = new Map(
      points.map((point) => [
        point.id,
        {
          id: point.id,
          routeName: point.routeName,
          name: point.name,
          lat: point.lat,
          lng: point.lng,
        },
      ])
    );
    const adjacency = new Map(points.map((point) => [point.id, new Set()]));
    const edgeDistances = new Map();

    for (let index = 0; index < points.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
        const current = points[index];
        const other = points[otherIndex];

        if (current.routeName === other.routeName) {
          continue;
        }

        const distance = distanceInMeters(current, other);

        if (distance > thresholdMeters) {
          continue;
        }

        adjacency.get(current.id).add(other.id);
        adjacency.get(other.id).add(current.id);
        edgeDistances.set(`${current.id}__${other.id}`, distance);
        edgeDistances.set(`${other.id}__${current.id}`, distance);
      }
    }

    const visited = new Set();
    const duplicates = [];

    points.forEach((point) => {
      if (visited.has(point.id) || !adjacency.get(point.id).size) {
        return;
      }

      const stack = [point.id];
      const groupIds = [];

      while (stack.length) {
        const currentId = stack.pop();
        if (visited.has(currentId)) {
          continue;
        }

        visited.add(currentId);
        groupIds.push(currentId);
        adjacency.get(currentId).forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            stack.push(neighborId);
          }
        });
      }

      const groupPoints = groupIds.map((id) => pointMap.get(id)).filter(Boolean);
      const routeNames = [...new Set(groupPoints.map((item) => item.routeName))];

      if (groupPoints.length < 2 || routeNames.length < 2) {
        return;
      }

      let minDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < groupPoints.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < groupPoints.length; otherIndex += 1) {
          const distance = edgeDistances.get(`${groupPoints[index].id}__${groupPoints[otherIndex].id}`);
          if (distance != null) {
            minDistance = Math.min(minDistance, distance);
          }
        }
      }

      duplicates.push({
        id: `duplicate-group-${groupIds.slice().sort().join("__")}`,
        distanceMeters: Number((Number.isFinite(minDistance) ? minDistance : 0).toFixed(1)),
        center: averagePoint(groupPoints),
        routeNames,
        points: groupPoints.sort((a, b) =>
          `${a.routeName} ${a.name}`.localeCompare(`${b.routeName} ${b.name}`, "ko")
        ),
      });
    });

    return duplicates.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  function detectOverlappingSegments(thresholdMeters = 30, routeNames = getRoutes()) {
    const routeNameSet = new Set(routeNames);
    const paths = getAllPaths().filter((pathItem) => routeNameSet.has(pathItem.routeName));
    const overlaps = [];
    const segments = [];

    paths.forEach((pathItem) => {
      for (let index = 0; index < pathItem.coordinates.length - 1; index += 1) {
        const start = pathItem.coordinates[index];
        const end = pathItem.coordinates[index + 1];
        segments.push({
          id: `${pathItem.id}-${index}`,
          routeName: pathItem.routeName,
          pathId: pathItem.id,
          pathName: pathItem.name,
          start,
          end,
          lengthMeters: distanceInMeters(start, end),
        });
      }
    });

    for (let index = 0; index < segments.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < segments.length; otherIndex += 1) {
        const current = segments[index];
        const other = segments[otherIndex];

        if (current.routeName === other.routeName) {
          continue;
        }

        const directMatch =
          distanceInMeters(current.start, other.start) <= thresholdMeters &&
          distanceInMeters(current.end, other.end) <= thresholdMeters;
        const reverseMatch =
          distanceInMeters(current.start, other.end) <= thresholdMeters &&
          distanceInMeters(current.end, other.start) <= thresholdMeters;

        if (!directMatch && !reverseMatch) {
          continue;
        }

        overlaps.push({
          id: `${current.id}__${other.id}`,
          routeNames: [current.routeName, other.routeName],
          pathNames: [current.pathName, other.pathName],
          averageLengthMeters: Number(((current.lengthMeters + other.lengthMeters) / 2).toFixed(1)),
          coordinates: [
            { lat: current.start.lat, lng: current.start.lng },
            { lat: current.end.lat, lng: current.end.lng },
          ],
        });
      }
    }

    return overlaps;
  }

  function summarizeLocalAnalysis(routeNames = getRoutes()) {
    const duplicatePoints = detectDuplicatePoints(30, routeNames);
    const overlappingSegments = detectOverlappingSegments(30, routeNames);

    return {
      analyzedAt: new Date().toISOString(),
      duplicatePointCount: duplicatePoints.length,
      overlappingSegmentCount: overlappingSegments.length,
      duplicatePoints,
      overlappingSegments,
    };
  }

  function estimateRouteDurationSeconds(distanceMeters) {
    const averageBusSpeedKmh = 18;
    const distanceKm = Number(distanceMeters || 0) / 1000;
    return distanceKm > 0 ? (distanceKm / averageBusSpeedKmh) * 3600 : 0;
  }

  function convertGeoPointToMeters(point, originLat) {
    const latRad = (Number(point.lat || 0) * Math.PI) / 180;
    const lngRad = (Number(point.lng || 0) * Math.PI) / 180;
    const originLatRad = (Number(originLat || 0) * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    return {
      x: earthRadiusMeters * lngRad * Math.cos(originLatRad),
      y: earthRadiusMeters * latRad,
    };
  }

  function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  function buildConvexHull(points) {
    const sorted = points
      .slice()
      .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

    if (sorted.length <= 1) {
      return sorted;
    }

    const lower = [];
    sorted.forEach((point) => {
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    });

    const upper = [];
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const point = sorted[index];
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function calculatePolygonAreaSquareMeters(points) {
    if (points.length < 3) {
      return 0;
    }

    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      area += current.x * next.y - next.x * current.y;
    }
    return Math.abs(area) / 2;
  }

  function calculateCoverageAreaSquareKm(routeNames) {
    const routeNameSet = new Set(routeNames);
    const rawPoints = [];

    getAllPoints().forEach((point) => {
      if (routeNameSet.has(point.routeName)) {
        rawPoints.push({ lat: point.lat, lng: point.lng });
      }
    });

    getAllPaths().forEach((pathItem) => {
      if (!routeNameSet.has(pathItem.routeName)) {
        return;
      }
      const coordinates = Array.isArray(pathItem.coordinates) ? pathItem.coordinates : [];
      if (!coordinates.length) {
        return;
      }
      const sampleStep = Math.max(1, Math.floor(coordinates.length / 50));
      for (let index = 0; index < coordinates.length; index += sampleStep) {
        const coordinate = coordinates[index];
        rawPoints.push({ lat: coordinate.lat, lng: coordinate.lng });
      }
      const lastCoordinate = coordinates[coordinates.length - 1];
      rawPoints.push({ lat: lastCoordinate.lat, lng: lastCoordinate.lng });
    });

    const uniquePoints = [];
    const seen = new Set();
    rawPoints.forEach((point) => {
      const key = `${Number(point.lat).toFixed(6)}:${Number(point.lng).toFixed(6)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePoints.push(point);
      }
    });

    if (uniquePoints.length < 3) {
      return 0;
    }

    const originLat = uniquePoints.reduce((sum, point) => sum + Number(point.lat || 0), 0) / uniquePoints.length;
    const meterPoints = uniquePoints.map((point) => convertGeoPointToMeters(point, originLat));
    const hull = buildConvexHull(meterPoints);
    return calculatePolygonAreaSquareMeters(hull) / 1000000;
  }

  function buildRouteGroupComparisonMetrics(routeNames, busCount, minimumBusPerRoute = 1) {
    const routeNameSet = new Set(routeNames);
    const routeSummaries = routeNames.map((routeName) => {
      const routePaths = getAllPaths().filter((pathItem) => pathItem.routeName === routeName);
      const routePoints = getAllPoints().filter((point) => point.routeName === routeName);
      const totalDistanceMeters = routePaths.reduce(
        (sum, pathItem) =>
          sum + (Number(pathItem.totalDistanceMeters || pathItem.estimatedDistanceMeters) || calculatePathDistanceMeters(pathItem)),
        0
      );
      const totalDurationSeconds = routePaths.reduce((sum, pathItem) => {
        const measuredDuration = Number(pathItem.totalDurationSeconds || pathItem.estimatedDurationSeconds) || 0;
        const fallbackDuration = estimateRouteDurationSeconds(
          Number(pathItem.totalDistanceMeters || pathItem.estimatedDistanceMeters) || calculatePathDistanceMeters(pathItem)
        );
        return sum + (measuredDuration || fallbackDuration);
      }, 0);

      return {
        routeName,
        pointCount: routePoints.length,
        pathCount: routePaths.length,
        totalRidership: routePoints.reduce((sum, point) => sum + (normalizeRidershipValue(point.ridership) || 0), 0),
        totalDistanceMeters,
        totalDurationSeconds,
      };
    });

    const totalDistanceMeters = routeSummaries.reduce((sum, route) => sum + route.totalDistanceMeters, 0);
    const totalDurationSeconds = routeSummaries.reduce((sum, route) => sum + route.totalDurationSeconds, 0);
    const totalRidership = routeSummaries.reduce((sum, route) => sum + route.totalRidership, 0);
    const local = summarizeLocalAnalysis(routeNames);
    const coverageAreaSquareKm = calculateCoverageAreaSquareKm(routeNames);
    const effectiveBusCount = Math.max(busCount, routeNames.length * minimumBusPerRoute);
    const averageBusesPerRoute = routeNames.length ? effectiveBusCount / routeNames.length : 0;
    const averageRouteDurationSeconds = routeNames.length ? totalDurationSeconds / routeNames.length : 0;
    const averageHeadwayMinutes = averageBusesPerRoute > 0 ? averageRouteDurationSeconds / 60 / averageBusesPerRoute : 0;

    return {
      routeNames,
      routeCount: routeNames.length,
      pointCount: getAllPoints().filter((point) => routeNameSet.has(point.routeName)).length,
      pathCount: getAllPaths().filter((pathItem) => routeNameSet.has(pathItem.routeName)).length,
      totalDistanceMeters,
      totalDurationSeconds,
      averageDistanceMeters: routeNames.length ? totalDistanceMeters / routeNames.length : 0,
      averageDurationSeconds: averageRouteDurationSeconds,
      busCount: effectiveBusCount,
      averageBusesPerRoute,
      averageHeadwayMinutes,
      averageWaitMinutes: averageHeadwayMinutes / 2,
      coverageAreaSquareKm,
      totalRidership,
      duplicatePointCount: local.duplicatePointCount,
      overlappingSegmentCount: local.overlappingSegmentCount,
      routeSummaries,
    };
  }

  function buildRouteGroupComparisonReport() {
    const existingRouteNames = getRouteNamesByGroup("default");
    const improvedRouteNames = getRouteNamesByGroup("merged");
    const existing = buildRouteGroupComparisonMetrics(existingRouteNames, existingRouteNames.length, 1);
    const improved = buildRouteGroupComparisonMetrics(improvedRouteNames, 12, 2);

    const distanceReductionMeters = Math.max(0, existing.totalDistanceMeters - improved.totalDistanceMeters);
    const durationReductionSeconds = Math.max(0, existing.averageDurationSeconds - improved.averageDurationSeconds);
    const waitReductionMinutes = Math.max(0, existing.averageWaitMinutes - improved.averageWaitMinutes);
    const coverageChangeSquareKm = improved.coverageAreaSquareKm - existing.coverageAreaSquareKm;

    return {
      generatedAt: new Date().toISOString(),
      type: "route-group-comparison-dashboard",
      existing,
      improved,
      assumptions: {
        existingBusPolicy: "개선 전 노선당 1대",
        improvedBusPolicy: "개선 후 노선당 최소 2대, 총 12대",
        fallbackSpeedKmh: 18,
      },
      improvements: {
        distanceReductionMeters,
        distanceReductionRate: existing.totalDistanceMeters > 0 ? distanceReductionMeters / existing.totalDistanceMeters : 0,
        durationReductionSeconds,
        durationReductionRate: existing.averageDurationSeconds > 0 ? durationReductionSeconds / existing.averageDurationSeconds : 0,
        waitReductionMinutes,
        waitReductionRate: existing.averageWaitMinutes > 0 ? waitReductionMinutes / existing.averageWaitMinutes : 0,
        coverageChangeSquareKm,
        coverageChangeRate: calculateChangeRate(existing.coverageAreaSquareKm, improved.coverageAreaSquareKm, "increase-good"),
        averageDistanceReductionRate: calculateChangeRate(existing.averageDistanceMeters, improved.averageDistanceMeters, "decrease-good"),
        busCountIncreaseRate: calculateChangeRate(existing.busCount, improved.busCount, "increase-good"),
        busesPerRouteIncreaseRate: calculateChangeRate(existing.averageBusesPerRoute, improved.averageBusesPerRoute, "increase-good"),
        headwayReductionRate: calculateChangeRate(existing.averageHeadwayMinutes, improved.averageHeadwayMinutes, "decrease-good"),
        duplicateReductionRate: calculateChangeRate(existing.duplicatePointCount, improved.duplicatePointCount, "decrease-good"),
        overlapReductionRate: calculateChangeRate(existing.overlappingSegmentCount, improved.overlappingSegmentCount, "decrease-good"),
      },
      message: `기존노선 ${existing.routeCount}개와 개선노선 ${improved.routeCount}개의 전후 비교표를 생성했습니다.`,
    };
  }

  function buildComparisonRow(label, beforeText, afterText, improvementText) {
    return `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(beforeText)}</td>
        <td>${escapeHtml(afterText)}</td>
        <td>${escapeHtml(improvementText)}</td>
      </tr>
    `;
  }

  function buildRouteComparisonWindowHtml(report) {
    const rows = [
      buildComparisonRow("총 노선 수", `${report.existing.routeCount}개`, `${report.improved.routeCount}개`, `${formatPercent(calculateChangeRate(report.existing.routeCount, report.improved.routeCount, "increase-good"))} 변화`),
      buildComparisonRow("총 정류장 수", `${report.existing.pointCount}개`, `${report.improved.pointCount}개`, `${formatPercent(calculateChangeRate(report.existing.pointCount, report.improved.pointCount, "increase-good"))} 변화`),
      buildComparisonRow("총 노선 운행거리", `${formatDistanceKm(report.existing.totalDistanceMeters)}km`, `${formatDistanceKm(report.improved.totalDistanceMeters)}km`, `${formatDistanceKm(report.improvements.distanceReductionMeters)}km 단축 (${formatPercent(report.improvements.distanceReductionRate)})`),
      buildComparisonRow("노선 구역 커버리지", `${formatAreaSquareKm(report.existing.coverageAreaSquareKm)}`, `${formatAreaSquareKm(report.improved.coverageAreaSquareKm)}`, `${report.improvements.coverageChangeSquareKm >= 0 ? "확대" : "축소"} ${formatPercent(Math.abs(report.improvements.coverageChangeRate))}`),
      buildComparisonRow("중복 정류장 후보", `${report.existing.duplicatePointCount}건`, `${report.improved.duplicatePointCount}건`, `${formatPercent(report.improvements.duplicateReductionRate)} 개선`),
      buildComparisonRow("중복 경로 구간", `${report.existing.overlappingSegmentCount}건`, `${report.improved.overlappingSegmentCount}건`, `${formatPercent(report.improvements.overlapReductionRate)} 개선`),
    ].join("");

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>전체노선 비교분석</title>
  <style>
    :root { color-scheme: light; --bg:#f4f7fb; --card:#ffffff; --line:#d7dfeb; --text:#172033; --muted:#5d6b85; --accent:#1d4ed8; --accent-soft:#e8f0ff; --good:#0f9f6e; }
    * { box-sizing:border-box; }
    body { margin:0; padding:24px; background:linear-gradient(180deg,#f8fbff 0%,#eef3f9 100%); color:var(--text); font:14px/1.5 "Segoe UI",sans-serif; }
    .wrap { max-width:1200px; margin:0 auto; }
    .hero { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:18px; }
    .hero h1 { margin:0 0 6px; font-size:28px; }
    .hero p { margin:0; color:var(--muted); }
    .cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
    .card { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 10px 30px rgba(19,34,68,.06); }
    .card h2 { margin:0 0 8px; font-size:13px; color:var(--muted); }
    .card strong { display:block; font-size:28px; margin-bottom:6px; }
    .card p { margin:0; color:var(--muted); }
    table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(19,34,68,.06); }
    th, td { padding:14px 16px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
    thead th { background:#f8fbff; font-size:13px; }
    tbody th { width:18%; background:#fcfdff; }
    tbody tr:last-child th, tbody tr:last-child td { border-bottom:none; }
    .detail { margin-top:18px; background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 10px 30px rgba(19,34,68,.06); }
    .detail h2 { margin:0 0 10px; font-size:18px; }
    .detail ul { margin:0; padding-left:18px; color:var(--muted); }
    .detail li + li { margin-top:8px; }
    .tag { display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; background:var(--accent-soft); color:var(--accent); font-size:12px; font-weight:700; }
    .good { color:var(--good); }
    @media (max-width: 900px) { .cards { grid-template-columns:1fr; } .hero { flex-direction:column; } table, thead, tbody, tr, th, td { display:block; } thead { display:none; } tbody th { width:auto; border-bottom:none; padding-bottom:0; } tbody td { padding-top:6px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div>
        <div class="tag">전체노선 비교분석</div>
        <h1>기존노선 vs 개선노선</h1>
        <p>${escapeHtml(report.message)}</p>
      </div>
      <p>${escapeHtml(new Date(report.generatedAt).toLocaleString("ko-KR"))}</p>
    </div>
    <div class="cards">
      <div class="card">
        <h2>총 운행거리 개선</h2>
        <strong class="good">${escapeHtml(formatDistanceKm(report.improvements.distanceReductionMeters))}km</strong>
        <p>${escapeHtml(formatPercent(report.improvements.distanceReductionRate))} 단축</p>
      </div>
      <div class="card">
        <h2>평균 운행시간 개선</h2>
        <strong class="good">${escapeHtml(String(formatDurationMinutes(report.improvements.durationReductionSeconds)))}분</strong>
        <p>${escapeHtml(formatPercent(report.improvements.durationReductionRate))} 단축</p>
      </div>
      <div class="card">
        <h2>평균 대기시간 개선</h2>
        <strong class="good">${escapeHtml(report.improvements.waitReductionMinutes.toFixed(1))}분</strong>
        <p>${escapeHtml(formatPercent(report.improvements.waitReductionRate))} 감소</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>비교 항목</th>
          <th>개선 전</th>
          <th>개선 후</th>
          <th>개선 내용</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="detail">
      <h2>상세 내용</h2>
      <ul>
        <li>개선 전은 노선당 1대 배차, 개선 후는 노선당 최소 2대이면서 총 12대를 균등 배분하는 조건으로 비교했습니다.</li>
        <li>운행시간은 경로에 저장된 총 운행시간을 우선 사용했고, 시간이 없는 경로는 평균 시속 ${escapeHtml(String(report.assumptions.fallbackSpeedKmh))}km 기준으로 보정했습니다.</li>
        <li>구역 커버리지는 정류장과 경로 좌표의 외곽 면적을 기준으로 계산해 전후 서비스 범위 변화를 비교했습니다.</li>
        <li>개선안은 평균 운행시간과 배차간격을 함께 줄여 승객 대기시간을 낮추는 방향으로 해석할 수 있습니다.</li>
        <li>중복 정류장과 중복 경로 구간 감소는 노선 체계 단순화와 운영 안정성 개선에 유리합니다.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  }

  function openRouteComparisonWindow(report) {
    const comparisonWindow = window.open("", "route-group-comparison-dashboard", "width=1360,height=920,resizable=yes,scrollbars=yes");
    if (!comparisonWindow) {
      setStatus("팝업이 차단되었습니다. 전체노선 비교분석 창을 허용해 주세요.", true);
      return false;
    }
    comparisonWindow.document.open();
    comparisonWindow.document.write(buildRouteComparisonWindowHtml(report));
    comparisonWindow.document.close();
    comparisonWindow.focus();
    return true;
  }

  function chooseCanonicalStopName(points) {
    const counts = new Map();
    points.forEach((point) => {
      const name = String(point.name || "Unnamed Stop").trim() || "Unnamed Stop";
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }
        if (a[0].length !== b[0].length) {
          return a[0].length - b[0].length;
        }
        return a[0].localeCompare(b[0], "ko");
      })[0]?.[0] || "Unnamed Stop";
  }

  function buildOptimizedStops() {
    const allPoints = getAllPoints();
    const duplicateGroups = detectDuplicatePoints(30);
    const stopMap = new Map();
    const pointToStopId = new Map();

    duplicateGroups.forEach((group, index) => {
      const stopId = `optimized-group-${index + 1}`;
      stopMap.set(stopId, {
        id: stopId,
        name: chooseCanonicalStopName(group.points),
        lat: group.center.lat,
        lng: group.center.lng,
        sourceRoutes: [...new Set(group.points.map((point) => point.routeName))].sort((a, b) => a.localeCompare(b, "ko")),
        memberPoints: group.points.map((point) => ({
          id: point.id,
          routeName: point.routeName,
          name: point.name,
          lat: point.lat,
          lng: point.lng,
        })),
        duplicate: true,
      });
      group.points.forEach((point) => pointToStopId.set(point.id, stopId));
    });

    allPoints.forEach((point) => {
      if (pointToStopId.has(point.id)) {
        return;
      }
      const stopId = `optimized-solo-${point.id}`;
      stopMap.set(stopId, {
        id: stopId,
        name: point.name,
        lat: point.lat,
        lng: point.lng,
        sourceRoutes: [point.routeName],
        memberPoints: [{ id: point.id, routeName: point.routeName, name: point.name, lat: point.lat, lng: point.lng }],
        duplicate: false,
      });
      pointToStopId.set(point.id, stopId);
    });

    return {
      duplicateGroups,
      pointToStopId,
      stops: [...stopMap.values()],
    };
  }

  function hasKeyword(text, keywords) {
    const normalized = String(text || "").toLowerCase();
    return keywords.some((keyword) => normalized.includes(keyword));
  }

  function classifyStopRole(stop) {
    const name = String(stop.name || "");
    return {
      isResidential: hasKeyword(name, ["아파트", "apt", "주공", "힐스", "푸르지오", "자이", "e편한", "주택", "마을", "단지"]),
      isTransitHub: hasKeyword(name, ["역", "station", "환승", "지하철", "subway"]),
      isImportantFacility: hasKeyword(name, ["주민센터", "행정복지센터", "구청", "시청", "군청", "도청", "복지관", "보건소", "병원", "학교", "도서관", "공원", "터미널"]),
    };
  }

  function estimatePopulationFromAddressText(text) {
    const normalized = String(text || "").toLowerCase();
    let households = 0;

    if (hasKeyword(normalized, ["아파트", "주공", "푸르지오", "자이", "래미안", "힐스", "e편한", "단지"])) {
      households += 180;
    }
    if (hasKeyword(normalized, ["오피스텔", "주상복합"])) {
      households += 90;
    }
    if (hasKeyword(normalized, ["빌라", "연립", "다세대", "주택"])) {
      households += 45;
    }
    if (hasKeyword(normalized, ["마을", "주거", "타운"])) {
      households += 30;
    }
    if (hasKeyword(normalized, ["학교", "병원", "복지관", "주민센터", "구청", "시청"])) {
      households += 25;
    }

    if (!households && normalized.trim()) {
      households = 18;
    }

    return households;
  }

  function estimatePointPopulation(point, radiusMeters = 100) {
    const nearbyPoints = getAllPoints().filter(
      (candidate) => candidate.id !== point.id && distanceInMeters(point, candidate) <= radiusMeters
    );
    const addressScore = estimatePopulationFromAddressText(`${point.address} ${point.name}`);
    const nearbyHouseholds = nearbyPoints.reduce(
      (sum, candidate) => sum + estimatePopulationFromAddressText(`${candidate.address} ${candidate.name}`),
      0
    );
    const residentialNearbyCount = nearbyPoints.filter((candidate) =>
      hasKeyword(`${candidate.address} ${candidate.name}`, ["아파트", "주공", "푸르지오", "자이", "래미안", "힐스", "e편한", "주택", "빌라", "연립", "다세대", "단지", "마을"])
    ).length;

    const estimatedHouseholds = Math.max(10, Math.round(addressScore + nearbyHouseholds * 0.6 + nearbyPoints.length * 8));
    const estimatedPopulation = Math.round(estimatedHouseholds * 2.2);

    return {
      radiusMeters,
      nearbyStopCount: nearbyPoints.length,
      residentialNearbyCount,
      estimatedHouseholds,
      estimatedPopulation,
      basisText: `반경 ${radiusMeters}m 내 주변 정류장 ${nearbyPoints.length}개와 주소 키워드를 기준으로 추정`,
    };
  }

  function buildRouteSequencesFromStops(routes, pointToStopId) {
    return routes
      .map((routeName) => ({
        routeName,
        stopIds: getAllPoints()
          .filter((point) => point.routeName === routeName)
          .sort(comparePointsByOrder)
          .map((point) => pointToStopId.get(point.id))
          .filter(Boolean)
          .filter((stopId, index, list) => stopId !== list[index - 1]),
      }))
      .filter((sequence) => sequence.stopIds.length);
  }

  function enrichOptimizedStops(stops, routeSequences) {
    const routeOrderByStopId = new Map();
    routeSequences.forEach((sequence) => {
      sequence.stopIds.forEach((stopId, index) => {
        if (!routeOrderByStopId.has(stopId)) {
          routeOrderByStopId.set(stopId, []);
        }
        routeOrderByStopId.get(stopId).push({ routeName: sequence.routeName, order: index });
      });
    });

    return stops.map((stop) => {
      const role = classifyStopRole(stop);
      const sideCounts = stop.memberPoints.reduce(
        (acc, point) => {
          const side = inferPointTravelSide(point);
          if (side === "right") {
            acc.right += 1;
          } else if (side === "left") {
            acc.left += 1;
          } else {
            acc.unknown += 1;
          }
          return acc;
        },
        { right: 0, left: 0, unknown: 0 }
      );
      const preferredTravelSide =
        sideCounts.right > sideCounts.left ? "right" : sideCounts.left > sideCounts.right ? "left" : "unknown";
      return {
        ...stop,
        ...role,
        routeOrders: routeOrderByStopId.get(stop.id) || [],
        sideCounts,
        preferredTravelSide,
        importanceScore:
          Number(role.isTransitHub) * 10 +
          Number(role.isImportantFacility) * 7 +
          Number(role.isResidential) * 5 +
          stop.memberPoints.length * 2 +
          stop.sourceRoutes.length,
      };
    });
  }

  function estimateLoopDistanceMeters(stops) {
    if (!Array.isArray(stops) || stops.length < 2) {
      return 0;
    }
    let total = 0;
    for (let index = 0; index < stops.length - 1; index += 1) {
      total += distanceInMeters(stops[index], stops[index + 1]);
    }
    total += distanceInMeters(stops[stops.length - 1], stops[0]);
    return total;
  }

  function estimateLoopDurationSeconds(distanceMeters, stopCount) {
    const averageBusSpeedMetersPerSecond = 18000 / 3600;
    return Math.round(distanceMeters / averageBusSpeedMetersPerSecond + stopCount * 25);
  }

  function getRouteUniqueStops(route) {
    if (!route || !Array.isArray(route.stops)) {
      return [];
    }
    if (route.stops.length > 1 && route.stops[0].id === route.stops[route.stops.length - 1].id) {
      return route.stops.slice(0, -1);
    }
    return route.stops.slice();
  }

  function angleFromHub(hubStop, stop) {
    return Math.atan2(stop.lat - hubStop.lat, stop.lng - hubStop.lng);
  }

  function sortStopsForSimpleLoop(hubStop, stops, direction = "clockwise") {
    const sorted = stops
      .filter((stop) => stop.id !== hubStop.id)
      .slice()
      .sort((a, b) => {
        const angleDiff = angleFromHub(hubStop, a) - angleFromHub(hubStop, b);
        if (angleDiff !== 0) {
          return angleDiff;
        }
        return distanceInMeters(hubStop, a) - distanceInMeters(hubStop, b);
      });
    return direction === "counterclockwise" ? sorted.reverse() : sorted;
  }

  function normalizeLoopStopSequence(stops) {
    const deduped = [];
    stops.forEach((stop) => {
      const last = deduped[deduped.length - 1];
      if (!last || last.id !== stop.id) {
        deduped.push(stop);
      }
    });
    if (deduped.length > 1 && deduped[0].id !== deduped[deduped.length - 1].id) {
      deduped.push(deduped[0]);
    }
    return deduped;
  }

  function orderRouteStopsForLoop(hubStop, candidateStops, direction = "clockwise") {
    const uniqueById = new Map();
    candidateStops.forEach((stop) => {
      if (stop.id !== hubStop.id && !uniqueById.has(stop.id)) {
        uniqueById.set(stop.id, stop);
      }
    });
    return normalizeLoopStopSequence([hubStop, ...sortStopsForSimpleLoop(hubStop, [...uniqueById.values()], direction)]);
  }

  function choosePrimaryTransferHubs(stops, desiredHubCount = 3) {
    const candidates = stops
      .filter((stop) => stop.isTransitHub || stop.isImportantFacility)
      .sort((a, b) => {
        const transitDiff = Number(b.isTransitHub) - Number(a.isTransitHub);
        if (transitDiff !== 0) {
          return transitDiff;
        }
        const routeDiff = b.sourceRoutes.length - a.sourceRoutes.length;
        if (routeDiff !== 0) {
          return routeDiff;
        }
        return b.importanceScore - a.importanceScore;
      });

    const picked = [];
    const minHubDistanceMeters = 1200;
    candidates.forEach((candidate) => {
      if (picked.length >= desiredHubCount) {
        return;
      }
      const tooClose = picked.some((pickedHub) => distanceInMeters(candidate, pickedHub) < minHubDistanceMeters);
      if (!tooClose) {
        picked.push(candidate);
      }
    });

    if (picked.length >= 2) {
      return picked;
    }

    const fallback = stops
      .slice()
      .sort((a, b) => b.importanceScore - a.importanceScore)
      .filter((candidate) => !picked.some((pickedHub) => pickedHub.id === candidate.id));

    fallback.forEach((candidate) => {
      if (picked.length >= Math.max(2, Math.min(desiredHubCount, 4))) {
        return;
      }
      const tooClose = picked.some((pickedHub) => distanceInMeters(candidate, pickedHub) < 900);
      if (!tooClose) {
        picked.push(candidate);
      }
    });

    return picked.length ? picked : stops.slice().sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 1);
  }

  function assignStopsToTransferHubs(stops, hubs) {
    const assignments = new Map(hubs.map((hub) => [hub.id, []]));
    stops.forEach((stop) => {
      let selectedHub = hubs[0];
      let bestScore = Number.POSITIVE_INFINITY;
      hubs.forEach((hub) => {
        const distance = distanceInMeters(stop, hub);
        const routePenalty = stop.sourceRoutes.some((routeName) => hub.sourceRoutes.includes(routeName)) ? -500 : 0;
        const score = distance + routePenalty;
        if (score < bestScore) {
          bestScore = score;
          selectedHub = hub;
        }
      });
      assignments.get(selectedHub.id).push(stop);
    });
    return assignments;
  }

  function canRouteMeetConstraints(stops, constraints = {}) {
    const {
      maxDistanceMeters = 9800,
      maxDurationSeconds = 3000,
      minUniqueStops = 3,
      maxUniqueStops = 9,
    } = constraints;
    const normalizedStops = normalizeLoopStopSequence(stops);
    const uniqueStops = normalizedStops.slice(0, -1);
    if (uniqueStops.length < minUniqueStops || uniqueStops.length > maxUniqueStops) {
      return false;
    }
    const distanceMeters = estimateLoopDistanceMeters(normalizedStops);
    const durationSeconds = estimateLoopDurationSeconds(distanceMeters, uniqueStops.length);
    return (
      distanceMeters <= maxDistanceMeters &&
      durationSeconds <= maxDurationSeconds &&
      hasValidStopSpacing(normalizedStops)
    );
  }

  function getConsecutiveStopDistances(stops) {
    if (!Array.isArray(stops) || stops.length < 2) {
      return [];
    }

    const distances = [];
    for (let index = 0; index < stops.length - 1; index += 1) {
      distances.push(distanceInMeters(stops[index], stops[index + 1]));
    }
    return distances;
  }

  function hasValidStopSpacing(stops, minMeters = 100, maxMeters = 300) {
    const distances = getConsecutiveStopDistances(stops);
    if (!distances.length) {
      return false;
    }
    return distances.every((distance) => distance >= minMeters && distance <= maxMeters);
  }

  function createOptimizedRouteRecord(routeNamePrefix, routeIndex, hubStop, stops, direction = "clockwise", serviceSide = "right") {
    const normalizedStops = normalizeLoopStopSequence(stops);
    return {
      id: `optimized-route-${routeIndex}`,
      routeName: `${routeNamePrefix}${routeIndex}`,
      hubStopId: hubStop.id,
      hubStopName: hubStop.name,
      transferStopIds: [hubStop.id],
      circulationDirection: direction,
      serviceSide,
      stops: normalizedStops,
      stopIds: normalizedStops.map((stop) => stop.id),
    };
  }

  function splitStopsByTravelSide(hubStop, assignedStops) {
    const buckets = {
      right: [],
      left: [],
      unknown: [],
    };
    assignedStops.forEach((stop) => {
      if (stop.id === hubStop.id) {
        return;
      }
      const side = stop.preferredTravelSide || "unknown";
      if (side === "left") {
        buckets.left.push(stop);
      } else if (side === "right") {
        buckets.right.push(stop);
      } else {
        buckets.unknown.push(stop);
      }
    });

    const targetBucket = buckets.right.length >= buckets.left.length ? "right" : "left";
    if (buckets.unknown.length) {
      buckets[targetBucket].push(...buckets.unknown);
    }

    return [
      { serviceSide: "right", direction: "clockwise", stops: buckets.right },
      { serviceSide: "left", direction: "counterclockwise", stops: buckets.left },
    ].filter((item) => item.stops.length);
  }

  function rebalanceSmallRouteGroups(groups, minGroupSize) {
    if (groups.length <= 1) {
      return groups;
    }

    for (let index = groups.length - 1; index >= 0; index -= 1) {
      if (groups[index].length >= minGroupSize) {
        continue;
      }

      if (index > 0) {
        groups[index - 1].push(...groups[index]);
      } else if (groups[index + 1]) {
        groups[index + 1] = [...groups[index], ...groups[index + 1]];
      }
      groups.splice(index, 1);
    }

    return groups;
  }

  function buildLoopRoutesForHub(hubStop, assignedStops, routeNamePrefix, startingIndex) {
    const routeConstraints = {
      maxDistanceMeters: 9800,
      maxDurationSeconds: 3000,
      minUniqueStops: 3,
      maxUniqueStops: 9,
    };
    const routes = [];
    let routeIndex = startingIndex;
    const sideGroups = splitStopsByTravelSide(hubStop, assignedStops);

    sideGroups.forEach(({ serviceSide, direction, stops }) => {
      const pool = sortStopsForSimpleLoop(hubStop, stops, direction);
      if (pool.length <= routeConstraints.minUniqueStops - 1) {
        routes.push(createOptimizedRouteRecord(routeNamePrefix, routeIndex, hubStop, [hubStop, ...pool], direction, serviceSide));
        routeIndex += 1;
        return;
      }

      const groups = [];
      let currentGroup = [];
      pool.forEach((candidate) => {
        if (currentGroup.length) {
          const previousStop = currentGroup[currentGroup.length - 1];
          const spacing = distanceInMeters(previousStop, candidate);
          if (spacing < 100) {
            return;
          }
          if (spacing > 300 && currentGroup.length >= routeConstraints.minUniqueStops - 1) {
            groups.push(currentGroup);
            currentGroup = [candidate];
            return;
          }
        }

        const proposedGroup = [...currentGroup, candidate];
        const proposedStops = orderRouteStopsForLoop(hubStop, proposedGroup, direction);
        if (canRouteMeetConstraints(proposedStops, routeConstraints)) {
          currentGroup = proposedGroup;
          return;
        }

        if (currentGroup.length) {
          groups.push(currentGroup);
          currentGroup = [candidate];
        } else {
          groups.push([candidate]);
        }
      });
      if (currentGroup.length) {
        groups.push(currentGroup);
      }

      rebalanceSmallRouteGroups(groups, routeConstraints.minUniqueStops - 1);

      groups.forEach((group) => {
        if (!group.length) {
          return;
        }
        routes.push(createOptimizedRouteRecord(routeNamePrefix, routeIndex, hubStop, [hubStop, ...group], direction, serviceSide));
        routeIndex += 1;
      });
    });

    return {
      routes,
      nextRouteIndex: routeIndex,
    };
  }

  function absorbUncoveredStopsIntoRoutes(routes, uncoveredStops, hubStop) {
    uncoveredStops.forEach((stop) => {
      let bestRoute = null;
      let bestScore = Number.POSITIVE_INFINITY;
      routes.forEach((route) => {
        if (
          stop.preferredTravelSide &&
          stop.preferredTravelSide !== "unknown" &&
          route.serviceSide &&
          route.serviceSide !== stop.preferredTravelSide
        ) {
          return;
        }
        const candidateUniqueStops = [...getRouteUniqueStops(route), stop];
        const candidateStops = orderRouteStopsForLoop(hubStop, candidateUniqueStops, route.circulationDirection);
        const distanceMeters = estimateLoopDistanceMeters(candidateStops);
        const durationSeconds = estimateLoopDurationSeconds(distanceMeters, candidateUniqueStops.length);
        if (distanceMeters > 9800 || durationSeconds > 3000 || candidateUniqueStops.length > 9) {
          return;
        }
        const score = distanceMeters + durationSeconds / 4;
        if (score < bestScore) {
          bestScore = score;
          bestRoute = route;
        }
      });

      if (bestRoute) {
        const nextStops = orderRouteStopsForLoop(
          hubStop,
          [...getRouteUniqueStops(bestRoute), stop],
          bestRoute.circulationDirection
        );
        bestRoute.stops = nextStops;
        bestRoute.stopIds = nextStops.map((item) => item.id);
      }
    });
  }

  function splitRouteIntoSimpleLoops(route, maxSegments = 2) {
    const uniqueStops = getRouteUniqueStops(route);
    if (uniqueStops.length <= 4) {
      return [route];
    }

    const [hubStop, ...others] = uniqueStops;
    const sorted = sortStopsForSimpleLoop(hubStop, others, route.circulationDirection);
    const chunkSize = Math.max(2, Math.ceil(sorted.length / Math.max(2, maxSegments)));
    const chunks = [];
    for (let index = 0; index < sorted.length; index += chunkSize) {
      chunks.push(sorted.slice(index, index + chunkSize));
    }
    rebalanceSmallRouteGroups(chunks, 2);

    return chunks
      .filter((chunk) => chunk.length)
      .map((chunk) => ({
        ...route,
        stops: orderRouteStopsForLoop(hubStop, [hubStop, ...chunk], route.circulationDirection),
        stopIds: orderRouteStopsForLoop(hubStop, [hubStop, ...chunk], route.circulationDirection).map((stop) => stop.id),
      }));
  }

  function mergeRoutePair(leftRoute, rightRoute) {
    const leftUniqueStops = getRouteUniqueStops(leftRoute);
    const rightUniqueStops = getRouteUniqueStops(rightRoute);
    const hubStop = leftUniqueStops[0] || rightUniqueStops[0];
    if (!hubStop) {
      return leftRoute;
    }

    const mergedStops = orderRouteStopsForLoop(hubStop, [...leftUniqueStops, ...rightUniqueStops]);
    return {
      ...leftRoute,
      hubStopId: hubStop.id,
      hubStopName: hubStop.name,
      transferStopIds: [...new Set([...(leftRoute.transferStopIds || []), ...(rightRoute.transferStopIds || []), hubStop.id])],
      stops: mergedStops,
      stopIds: mergedStops.map((stop) => stop.id),
    };
  }

  function balanceOptimizedRouteCount(routes, minRoutes = 5, maxRoutes = 15) {
    let workingRoutes = routes.slice();

    while (workingRoutes.length < minRoutes) {
      let splitIndex = -1;
      let splitSize = 0;
      workingRoutes.forEach((route, index) => {
        const uniqueCount = getRouteUniqueStops(route).length;
        if (uniqueCount > splitSize && uniqueCount >= 6) {
          splitIndex = index;
          splitSize = uniqueCount;
        }
      });

      if (splitIndex === -1) {
        break;
      }

      const routeToSplit = workingRoutes[splitIndex];
      const currentUniqueCount = getRouteUniqueStops(routeToSplit).length;
      const shortage = minRoutes - workingRoutes.length;
      const targetSegments = Math.min(
        Math.max(2, shortage + 1),
        Math.max(2, Math.floor(currentUniqueCount / 2))
      );
      const splitRoutes = splitRouteIntoSimpleLoops(routeToSplit, targetSegments);
      if (splitRoutes.length <= 1) {
        break;
      }
      workingRoutes.splice(splitIndex, 1, ...splitRoutes);
    }

    while (workingRoutes.length > maxRoutes) {
      let mergeIndex = -1;
      let mergeScore = Number.POSITIVE_INFINITY;
      for (let index = 0; index < workingRoutes.length - 1; index += 1) {
        const currentCount = getRouteUniqueStops(workingRoutes[index]).length;
        const nextCount = getRouteUniqueStops(workingRoutes[index + 1]).length;
        const score = currentCount + nextCount;
        if (score < mergeScore) {
          mergeScore = score;
          mergeIndex = index;
        }
      }

      if (mergeIndex === -1) {
        break;
      }

      const merged = mergeRoutePair(workingRoutes[mergeIndex], workingRoutes[mergeIndex + 1]);
      workingRoutes.splice(mergeIndex, 2, merged);
    }

    return workingRoutes;
  }

  function ensureSharedTransferStops(routes) {
    const stopUsage = new Map();
    routes.forEach((route) => {
      (route.transferStopIds || []).forEach((stopId) => {
        stopUsage.set(stopId, (stopUsage.get(stopId) || 0) + 1);
      });
    });

    return routes.map((route) => {
      const uniqueStops = getRouteUniqueStops(route);
      const transferStops = uniqueStops.filter((stop) => stop.isTransitHub || stop.isImportantFacility);
      let transferStopIds = transferStops
        .map((stop) => stop.id)
        .filter((stopId) => (stopUsage.get(stopId) || 0) > 1);

      if (!transferStopIds.length) {
        const fallbackStop = uniqueStops.find((stop) => stop.id === route.hubStopId) || uniqueStops[0];
        transferStopIds = fallbackStop ? [fallbackStop.id] : [];
      }

      return {
        ...route,
        transferStopIds,
      };
    });
  }

  function hasSharedTransferStop(route, routes) {
    return (route.transferStopIds || []).some((stopId) =>
      routes.some((otherRoute) => otherRoute.id !== route.id && (otherRoute.transferStopIds || []).includes(stopId))
    );
  }

  function buildReachabilityGraph(routes) {
    const graph = new Map(routes.map((route) => [route.id, new Set()]));
    for (let index = 0; index < routes.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < routes.length; otherIndex += 1) {
        const current = routes[index];
        const other = routes[otherIndex];
        const sharesTransfer = current.transferStopIds.some((stopId) => other.transferStopIds.includes(stopId));
        if (sharesTransfer) {
          graph.get(current.id).add(other.id);
          graph.get(other.id).add(current.id);
        }
      }
    }
    return graph;
  }

  function calculateMaxTransfers(routes) {
    if (routes.length <= 1) {
      return 0;
    }
    const graph = buildReachabilityGraph(routes);
    let maxTransfers = 0;
    routes.forEach((route) => {
      const queue = [{ routeId: route.id, depth: 0 }];
      const visited = new Set([route.id]);
      while (queue.length) {
        const current = queue.shift();
        maxTransfers = Math.max(maxTransfers, current.depth);
        (graph.get(current.routeId) || []).forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ routeId: neighborId, depth: current.depth + 1 });
          }
        });
      }
    });
    return maxTransfers;
  }

  function buildOptimizationPlan() {
    const sourceRoutes = getRoutes();
    const allPoints = getAllPoints();
    if (allPoints.length < 2) {
      throw new Error("최적화를 하려면 정류장이 2개 이상 필요합니다.");
    }

    const optimized = buildOptimizedStops();
    const routeSequences = buildRouteSequencesFromStops(sourceRoutes, optimized.pointToStopId);
    const enrichedStops = enrichOptimizedStops(optimized.stops, routeSequences);
    const desiredHubCount = Math.max(2, Math.min(4, Math.round(enrichedStops.length / 18)));
    const transferHubs = choosePrimaryTransferHubs(enrichedStops, desiredHubCount);
    const hubAssignments = assignStopsToTransferHubs(enrichedStops, transferHubs);

    const routes = [];
    let routeIndex = 1;
    transferHubs.forEach((hubStop) => {
      const assignedStops = hubAssignments.get(hubStop.id) || [hubStop];
      const built = buildLoopRoutesForHub(hubStop, assignedStops, "신규", routeIndex);
      routes.push(...built.routes);
      routeIndex = built.nextRouteIndex;
    });

    const balancedRoutes = balanceOptimizedRouteCount(routes, 5, 15);

    const coveredStopIds = new Set(balancedRoutes.flatMap((route) => route.stopIds));
    absorbUncoveredStopsIntoRoutes(
      balancedRoutes,
      enrichedStops.filter((stop) => !coveredStopIds.has(stop.id)),
      transferHubs[0]
    );
    const transferReadyRoutes = ensureSharedTransferStops(balancedRoutes);

    const summarizedRoutes = transferReadyRoutes.map((route) => {
      const uniqueStops = getRouteUniqueStops(route);
      const estimatedDistanceMeters = Number(estimateLoopDistanceMeters(route.stops).toFixed(1));
      const estimatedDurationSeconds = estimateLoopDurationSeconds(estimatedDistanceMeters, uniqueStops.length);
      return {
        ...route,
        uniqueStops,
        estimatedDistanceMeters,
        estimatedDurationSeconds,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      sourceRoutes,
      sourceRouteCount: sourceRoutes.length,
      originalPointCount: allPoints.length,
      optimizedStopCount: enrichedStops.length,
      removedStopCount: Math.max(0, allPoints.length - enrichedStops.length),
      duplicateGroupCount: optimized.duplicateGroups.length,
      duplicateGroups: optimized.duplicateGroups,
      transferHubs: transferHubs.map((hub) => ({
        id: hub.id,
        name: hub.name,
        lat: hub.lat,
        lng: hub.lng,
        sourceRoutes: hub.sourceRoutes,
      })),
      routes: summarizedRoutes,
      maxTransfers: calculateMaxTransfers(summarizedRoutes),
      constraints: {
        maxDistanceMeters: 12000,
        maxDurationSeconds: 3600,
        maxTransfers: 2,
        minRoutes: 5,
        maxRoutes: 15,
        loopRequired: true,
      },
    };
  }

  function appendUniqueCoordinates(target, coordinates) {
    coordinates.forEach((coordinate) => {
      const normalized = {
        lat: Number(coordinate.lat),
        lng: Number(coordinate.lng),
        altitude: null,
      };
      if (!Number.isFinite(normalized.lat) || !Number.isFinite(normalized.lng)) {
        return;
      }
      const last = target[target.length - 1];
      if (!last || last.lat !== normalized.lat || last.lng !== normalized.lng) {
        target.push(normalized);
      }
    });
  }

  function measureCoordinatePathDistance(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return 0;
    }

    let distance = 0;
    for (let index = 1; index < coordinates.length; index += 1) {
      distance += segmentLengthMeters(coordinates[index - 1], coordinates[index]);
    }
    return Number(distance.toFixed(1));
  }

  function findNearestCoordinateIndex(coordinates, point) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    coordinates.forEach((coordinate, index) => {
      const distance = distanceInMeters(coordinate, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return {
      index: bestIndex,
      distanceMeters: bestDistance,
    };
  }

  function sliceCoordinatesBetweenPoints(coordinates, startPoint, endPoint, toleranceMeters = 250) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return [];
    }

    const start = findNearestCoordinateIndex(coordinates, startPoint);
    const end = findNearestCoordinateIndex(coordinates, endPoint);

    if (start.index < 0 || end.index < 0) {
      return [];
    }
    if (start.distanceMeters > toleranceMeters || end.distanceMeters > toleranceMeters) {
      return [];
    }
    if (end.index <= start.index) {
      return [];
    }

    return coordinates.slice(start.index, end.index + 1);
  }

  async function requestDesignedRouteSegment(routeName, points, designOptions = {}) {
    if (points.length < 2) {
      throw new Error("Designed route segment requires at least two points.");
    }

    const result = await requestDesignedRoute(routeName, points, designOptions);
    const selected = chooseBestDesignedRoute(result.routes, designOptions);
    if (!selected) {
      throw new Error("Designed route did not return a usable route.");
    }
    const coordinates = extractDesignedRouteCoordinates(result, selected.index);
    const summary = extractDesignedRouteSummary(result, selected.index);
    if (coordinates.length < 2) {
      throw new Error("Designed route did not return enough coordinates.");
    }
    return {
      payload: result,
      routeIndex: selected.index,
      coordinates,
      usedFallback: false,
      totalDistanceMeters: summary.totalDistanceMeters,
      totalDurationSeconds: summary.totalDurationSeconds,
    };
  }

  async function requestDesignedRoutePairWithContext(routeName, allPoints, startIndex, designOptions = {}) {
    const startPoint = allPoints[startIndex];
    const endPoint = allPoints[startIndex + 1];
    const attempts = [];

    if (startIndex > 0 && startIndex + 1 < allPoints.length - 1) {
      attempts.push({
        label: "context-both",
        points: [allPoints[startIndex - 1], startPoint, endPoint, allPoints[startIndex + 2]],
        sectionIndex: 1,
      });
    }
    if (startIndex > 0) {
      attempts.push({
        label: "context-prev",
        points: [allPoints[startIndex - 1], startPoint, endPoint],
        sectionIndex: 1,
      });
    }
    if (startIndex + 1 < allPoints.length - 1) {
      attempts.push({
        label: "context-next",
        points: [startPoint, endPoint, allPoints[startIndex + 2]],
        sectionIndex: 0,
      });
    }

    for (const attempt of attempts) {
      try {
        const result = await requestDesignedRouteSegment(`${routeName}-${attempt.label}-${startIndex + 1}`, attempt.points, designOptions);
        const sectionCoordinates = extractDesignedRouteSectionCoordinates(
          result.payload,
          result.routeIndex,
          attempt.sectionIndex
        );
        if (sectionCoordinates.length >= 2) {
          const sectionSummary = extractDesignedRouteSectionSummary(
            result.payload,
            result.routeIndex,
            attempt.sectionIndex
          );
          return {
            coordinates: sectionCoordinates,
            usedFallback: false,
            totalDistanceMeters: sectionSummary.totalDistanceMeters || measureCoordinatePathDistance(sectionCoordinates),
            totalDurationSeconds: sectionSummary.totalDurationSeconds || result.totalDurationSeconds,
          };
        }
        const slicedCoordinates = sliceCoordinatesBetweenPoints(result.coordinates, startPoint, endPoint);
        if (slicedCoordinates.length >= 2) {
          const slicedDistance = measureCoordinatePathDistance(slicedCoordinates);
          const distanceRatio = result.totalDistanceMeters > 0 ? Math.min(1, slicedDistance / result.totalDistanceMeters) : 0;
          return {
            coordinates: slicedCoordinates,
            usedFallback: false,
            totalDistanceMeters: slicedDistance,
            totalDurationSeconds: Math.round((result.totalDurationSeconds || 0) * distanceRatio),
          };
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`"${startPoint?.name || `${startIndex + 1}번 정류장`}" -> "${endPoint?.name || `${startIndex + 2}번 정류장`}" 구간의 도로 경로를 생성하지 못했습니다.`);
  }

  async function requestDesignedRouteRange(routeName, allPoints, startIndex, endIndex, designOptions = {}, depth = 0) {
    const rangePoints = allPoints.slice(startIndex, endIndex + 1);
    if (rangePoints.length < 2) {
      throw new Error("노선 생성에는 정류장 2개 이상이 필요합니다.");
    }

    const maxPointsPerRequest = 10;
    const canTryDirectRequest = rangePoints.length <= maxPointsPerRequest;

    if (canTryDirectRequest) {
      try {
        return await requestDesignedRouteSegment(`${routeName}-${startIndex + 1}-${endIndex + 1}`, rangePoints, designOptions);
      } catch (error) {
        if (rangePoints.length === 2) {
          return requestDesignedRoutePairWithContext(routeName, allPoints, startIndex, designOptions);
        }
      }
    }

    if (rangePoints.length === 2) {
      return requestDesignedRoutePairWithContext(routeName, allPoints, startIndex, designOptions);
    }

    const splitIndex = Math.floor((startIndex + endIndex) / 2);
    if (splitIndex <= startIndex || splitIndex >= endIndex) {
      return requestDesignedRoutePairWithContext(routeName, allPoints, startIndex, designOptions);
    }

    const leftSegment = await requestDesignedRouteRange(routeName, allPoints, startIndex, splitIndex, designOptions, depth + 1);
    const rightSegment = await requestDesignedRouteRange(routeName, allPoints, splitIndex, endIndex, designOptions, depth + 1);
    const coordinates = [];
    appendUniqueCoordinates(coordinates, leftSegment.coordinates);
    appendUniqueCoordinates(coordinates, rightSegment.coordinates);

    return {
      coordinates,
      usedFallback: false,
      totalDistanceMeters: Number(((leftSegment.totalDistanceMeters || 0) + (rightSegment.totalDistanceMeters || 0)).toFixed(1)),
      totalDurationSeconds: Math.round((leftSegment.totalDurationSeconds || 0) + (rightSegment.totalDurationSeconds || 0)),
    };
  }

  async function requestDesignedRouteInBatches(routeName, points, designOptions = {}) {
    if (points.length < 2) {
      throw new Error("노선 생성에는 정류장 2개 이상이 필요합니다.");
    }

    try {
      return await requestDesignedRouteRange(routeName, points, 0, points.length - 1, designOptions);
    } catch (error) {
      throw new Error(error.message || "도로 경로를 생성하지 못했습니다.");
    }
  }

  function finalizeRouteMetrics(route) {
    const uniqueStops = getRouteUniqueStops(route);
    const estimatedDistanceMeters = Number(estimateLoopDistanceMeters(route.stops).toFixed(1));
    const estimatedDurationSeconds = estimateLoopDurationSeconds(estimatedDistanceMeters, uniqueStops.length);
    return {
      ...route,
      uniqueStops,
      estimatedDistanceMeters,
      estimatedDurationSeconds,
    };
  }

  function coordinateKey(coordinate, precision = 4) {
    return `${Number(coordinate.lat).toFixed(precision)},${Number(coordinate.lng).toFixed(precision)}`;
  }

  function routeStopOverlapRatio(leftRoute, rightRoute) {
    const leftIds = new Set(getRouteUniqueStops(leftRoute).map((stop) => stop.id));
    const rightIds = new Set(getRouteUniqueStops(rightRoute).map((stop) => stop.id));
    if (!leftIds.size || !rightIds.size) {
      return 0;
    }
    let sharedCount = 0;
    leftIds.forEach((stopId) => {
      if (rightIds.has(stopId)) {
        sharedCount += 1;
      }
    });
    return sharedCount / Math.min(leftIds.size, rightIds.size);
  }

  function routePathOverlapRatio(leftRoute, rightRoute) {
    const leftCoordinates = Array.isArray(leftRoute.coordinates) ? leftRoute.coordinates : [];
    const rightCoordinates = Array.isArray(rightRoute.coordinates) ? rightRoute.coordinates : [];
    if (!leftCoordinates.length || !rightCoordinates.length) {
      return 0;
    }
    const leftKeys = new Set(leftCoordinates.map((coordinate) => coordinateKey(coordinate)));
    const rightKeys = new Set(rightCoordinates.map((coordinate) => coordinateKey(coordinate)));
    let sharedCount = 0;
    leftKeys.forEach((key) => {
      if (rightKeys.has(key)) {
        sharedCount += 1;
      }
    });
    return sharedCount / Math.min(leftKeys.size, rightKeys.size);
  }

  function routeOverlapRatio(leftRoute, rightRoute) {
    const stopOverlap = routeStopOverlapRatio(leftRoute, rightRoute);
    const pathOverlap = routePathOverlapRatio(leftRoute, rightRoute);
    return Math.max(stopOverlap, pathOverlap, (stopOverlap + pathOverlap) / 2);
  }

  function mergeHighlyOverlappingRoutes(routes, threshold = 0.3) {
    const workingRoutes = routes.slice();
    let mergedAny = true;

    while (mergedAny) {
      mergedAny = false;
      outer: for (let index = 0; index < workingRoutes.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < workingRoutes.length; otherIndex += 1) {
          const current = workingRoutes[index];
          const other = workingRoutes[otherIndex];
          if (current.serviceSide !== other.serviceSide) {
            continue;
          }
          const overlapRatio = routeOverlapRatio(current, other);
          if (overlapRatio < threshold) {
            continue;
          }

          const merged = finalizeRouteMetrics(mergeRoutePair(current, other));
          workingRoutes.splice(otherIndex, 1);
          workingRoutes.splice(index, 1, merged);
          mergedAny = true;
          break outer;
        }
      }
    }

    return workingRoutes;
  }

  function violatesFinalConstraints(route) {
    const distanceMeters = Number(route.totalDistanceMeters || route.estimatedDistanceMeters || 0);
    const durationSeconds = Number(route.totalDurationSeconds || route.estimatedDurationSeconds || 0);
    const uniqueStopCount = getRouteUniqueStops(route).length;
    return (
      uniqueStopCount < 3 ||
      distanceMeters > 12000 ||
      durationSeconds > 3600 ||
      !hasValidStopSpacing(route.stops) ||
      !(route.transferStopIds || []).length ||
      route.stops.length < 4 ||
      route.stops[0]?.id !== route.stops[route.stops.length - 1]?.id
    );
  }

  function evaluateRouteIssues(route, routes = []) {
    const distanceMeters = Number(route.totalDistanceMeters || route.estimatedDistanceMeters || 0);
    const durationSeconds = Number(route.totalDurationSeconds || route.estimatedDurationSeconds || 0);
    const uniqueStopCount = getRouteUniqueStops(route).length;
    const issues = [];

    if (uniqueStopCount < 3) {
      issues.push("정류장 수 부족");
    }
    if (distanceMeters > 12000) {
      issues.push("총거리 12km 초과");
    }
    if (durationSeconds > 3600) {
      issues.push("운행시간 60분 초과");
    }
    if (!hasValidStopSpacing(route.stops)) {
      issues.push("정류장 간격 100~300m 위반");
    }
    if (!(route.transferStopIds || []).length) {
      issues.push("환승 정류장 없음");
    }
    if (routes.length && !hasSharedTransferStop(route, routes)) {
      issues.push("공유 환승 정류장 없음");
    }
    if (route.stops.length < 4) {
      issues.push("순환 정류장 수 부족");
    }
    if (route.stops[0]?.id !== route.stops[route.stops.length - 1]?.id) {
      issues.push("시작/종료 정류장 불일치");
    }

    return issues;
  }

  function renameOptimizedRoutes(routes, prefix = "신규") {
    return routes.map((route, index) => ({
      ...route,
      id: `optimized-route-${index + 1}`,
      routeName: `${prefix}${index + 1}`,
    }));
  }

  async function materializeOptimizedRoutes(routes) {
    const finalized = [];

    for (const route of routes) {
      const designedRoute = await requestDesignedRouteInBatches(route.routeName, route.stops);
      let candidate = finalizeRouteMetrics({
        ...route,
        coordinates: designedRoute.coordinates,
        usedFallback: designedRoute.usedFallback,
        totalDistanceMeters: designedRoute.totalDistanceMeters,
        totalDurationSeconds: designedRoute.totalDurationSeconds,
      });

      if (violatesFinalConstraints(candidate)) {
        const splitRoutes = splitRouteIntoSimpleLoops(candidate, 2);
        if (splitRoutes.length > 1) {
          for (const splitRoute of splitRoutes) {
            const splitDesignedRoute = await requestDesignedRouteInBatches(splitRoute.routeName, splitRoute.stops);
            finalized.push(
              finalizeRouteMetrics({
                ...splitRoute,
                coordinates: splitDesignedRoute.coordinates,
                usedFallback: splitDesignedRoute.usedFallback,
                totalDistanceMeters: splitDesignedRoute.totalDistanceMeters,
                totalDurationSeconds: splitDesignedRoute.totalDurationSeconds,
              })
            );
          }
          continue;
        }
      }

      finalized.push(candidate);
    }

    const finalizedRoutes = mergeHighlyOverlappingRoutes(finalized.map((route) => finalizeRouteMetrics(route)), 0.3);
    const strictRoutes = ensureSharedTransferStops(
      renameOptimizedRoutes(finalizedRoutes.filter((route) => !violatesFinalConstraints(route)))
    ).filter((route, _index, allRoutes) => hasSharedTransferStop(route, allRoutes));

    if (strictRoutes.length) {
      return strictRoutes;
    }

    return ensureSharedTransferStops(
      renameOptimizedRoutes(
        finalizedRoutes
          .map((route) => ({
            ...route,
            optimizationIssues: evaluateRouteIssues(route),
          }))
          .sort((a, b) => a.optimizationIssues.length - b.optimizationIssues.length)
      )
    );
  }

  function buildOptimizationPreviewHtml(plan, appKey) {
    const payload = JSON.stringify({
      sourceRoutes: plan.sourceRoutes,
      originalPointCount: plan.originalPointCount,
      optimizedStopCount: plan.optimizedStopCount,
      removedStopCount: plan.removedStopCount,
      maxTransfers: plan.maxTransfers,
      transferHubs: plan.transferHubs,
      routes: plan.routes.map((route) => ({
        id: route.id,
        routeName: route.routeName,
        hubStopName: route.hubStopName,
        estimatedDistanceMeters: route.estimatedDistanceMeters,
        estimatedDurationSeconds: route.estimatedDurationSeconds,
        totalDistanceMeters: route.totalDistanceMeters,
        totalDurationSeconds: route.totalDurationSeconds,
        usedFallback: route.usedFallback,
        serviceSide: route.serviceSide || "right",
        circulationDirection: route.circulationDirection || "clockwise",
        stops: route.stops,
        uniqueStops: route.uniqueStops,
        optimizationIssues: route.optimizationIssues || [],
        coordinates: route.coordinates || [],
      })),
    }).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>최적화 노선 결과</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --card: rgba(255,255,255,0.94);
      --line: #d8d1c5;
      --text: #1f1a14;
      --muted: #6f675d;
      --accent: #bf5b2c;
      --shadow: 0 18px 44px rgba(58, 42, 20, 0.12);
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", "Noto Sans KR", sans-serif; color: var(--text); background: radial-gradient(circle at top left, #fdf7eb, var(--bg) 58%); }
    .layout { display: grid; grid-template-columns: 420px 1fr; min-height: 100vh; }
    .sidebar { padding: 20px; border-right: 1px solid var(--line); background: var(--card); overflow: auto; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    .muted { color: var(--muted); font-size: 13px; line-height: 1.5; }
    .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
    .stat, .card { padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: var(--shadow); }
    .stat strong { display: block; margin-top: 4px; font-size: 22px; }
    .card { margin-top: 14px; }
    .card h2 { margin: 0 0 10px; font-size: 15px; }
    .card ul { margin: 0; padding-left: 18px; }
    .card li + li { margin-top: 6px; }
    .toolbar { display: flex; gap: 10px; margin-top: 14px; }
    .button { appearance: none; border: 0; border-radius: 12px; padding: 11px 14px; cursor: pointer; font: inherit; font-weight: 700; }
    .button.primary { background: var(--accent); color: #fff; }
    .button.secondary { background: #efe2cf; color: #4d3722; }
    .tag { display: inline-flex; margin: 4px 6px 0 0; padding: 5px 8px; border-radius: 999px; background: #fff1dc; color: #c2410c; font-size: 12px; font-weight: 700; }
    .route-panel { border: 1px solid var(--line); border-radius: 14px; background: #fffcf7; padding: 12px; }
    .route-panel + .route-panel { margin-top: 12px; }
    .route-head { display: flex; gap: 10px; align-items: flex-start; }
    .route-head input { margin-top: 3px; }
    .route-title { flex: 1; min-width: 0; }
    .route-title strong { display: block; font-size: 16px; }
    .route-meta { color: var(--muted); font-size: 12px; margin-top: 3px; }
    .stop-list { margin: 10px 0 0; padding-left: 22px; }
    .stop-list li + li { margin-top: 4px; }
    .map-wrap { position: relative; min-height: 100vh; }
    #map { height: 100vh; width: 100%; }
    .legend { position: absolute; top: 18px; right: 18px; z-index: 3; width: min(320px, calc(100% - 36px)); padding: 14px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,0.94); box-shadow: var(--shadow); }
    .legend h2 { margin: 0 0 8px; font-size: 14px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
    .legend-item + .legend-item { margin-top: 6px; }
    .swatch { width: 12px; height: 12px; border-radius: 999px; display: inline-block; flex: none; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } #map { height: 60vh; } }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <h1>최적화 결과</h1>
      <p class="muted">지하철역 환승 허브를 중심으로 순환형 노선을 재구성한 결과입니다.</p>
      <div class="stats">
        <div class="stat"><span>원본 정류장</span><strong id="original-count"></strong></div>
        <div class="stat"><span>최적화 정류장</span><strong id="optimized-count"></strong></div>
        <div class="stat"><span>통합된 정류장</span><strong id="removed-count"></strong></div>
        <div class="stat"><span>최대 환승</span><strong id="transfer-count"></strong></div>
      </div>
      <div class="card">
        <h2>대상 노선</h2>
        <div id="route-tags"></div>
      </div>
      <div class="card">
        <h2>환승 허브</h2>
        <ul id="hub-list"></ul>
      </div>
      <div class="card">
        <h2>생성된 노선</h2>
        <div id="route-list"></div>
      </div>
      <div class="toolbar">
        <button id="toggle-all-routes" class="button secondary" type="button">전체 해제</button>
        <button id="save-optimized-kml" class="button primary" type="button">KML 저장</button>
      </div>
    </aside>
    <main class="map-wrap">
      <div id="map"></div>
      <div class="legend">
        <h2>지도 사용법</h2>
        <div class="legend-item"><span class="swatch" style="background:#bf5b2c;"></span><span>노선 체크박스를 끄면 지도에서 숨겨집니다.</span></div>
        <div class="legend-item"><span class="swatch" style="background:#1d4ed8;"></span><span>노선을 클릭하면 거리와 운행시간을 확인할 수 있습니다.</span></div>
        <div class="legend-item"><span class="swatch" style="background:#0f766e;"></span><span>정류장을 클릭하면 순번과 원본 노선을 확인할 수 있습니다.</span></div>
      </div>
    </main>
  </div>
  <script>
    const APP_KEY = ${JSON.stringify(String(appKey || ""))};
    const DATA = ${payload};
    const ROUTE_COLORS = ["#bf5b2c", "#0f766e", "#2563eb", "#9333ea", "#dc2626", "#d97706", "#0f6cbd", "#15803d"];
    const byId = (id) => document.getElementById(id);
    byId("original-count").textContent = String(DATA.originalPointCount);
    byId("optimized-count").textContent = String(DATA.optimizedStopCount);
    byId("removed-count").textContent = String(DATA.removedStopCount);
    byId("transfer-count").textContent = String(DATA.maxTransfers);
    byId("route-tags").innerHTML = DATA.sourceRoutes.map((route) => '<span class="tag">' + route + '</span>').join("");
    byId("hub-list").innerHTML = DATA.transferHubs.map((hub) => '<li><strong>' + hub.name + '</strong><br>' + hub.sourceRoutes.join(', ') + '</li>').join("");

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function escapeXml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    }

    function formatDistance(meters) {
      return ((Number(meters || 0) / 1000).toFixed(1)) + "km";
    }

    function formatDuration(seconds) {
      return Math.max(1, Math.round(Number(seconds || 0) / 60)) + "분";
    }

    function toKmlColor(hexColor, alpha) {
      const normalized = String(hexColor || "").replace("#", "").toLowerCase();
      if (!/^[0-9a-f]{6}$/.test(normalized)) {
        return (alpha || "ff") + "bd6c0f";
      }
      return (alpha || "ff") + normalized.slice(4, 6) + normalized.slice(2, 4) + normalized.slice(0, 2);
    }

    DATA.routes = DATA.routes.map((route, index) => ({
      ...route,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      visible: true,
    }));

    function buildPreviewKml() {
      const styles = DATA.routes.map((route) => {
        const styleId = "route-" + route.id;
        return [
          '<Style id="' + escapeXml(styleId) + '">',
          '<IconStyle><color>' + toKmlColor(route.color, "ff") + '</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-circle.png</href></Icon></IconStyle>',
          '<LineStyle><color>' + toKmlColor(route.color, "ff") + '</color><width>4</width></LineStyle>',
          '</Style>'
        ].join("");
      }).join("");

      const folders = DATA.routes.map((route) => {
        const styleId = "route-" + route.id;
        const stops = route.stops.map((stop, index) => {
          return [
            '<Placemark>',
            '<name>' + escapeXml((index + 1) + '. ' + stop.name) + '</name>',
            '<styleUrl>#' + escapeXml(styleId) + '</styleUrl>',
            '<description>' + escapeXml(route.routeName + ' / ' + stop.sourceRoutes.join(", ")) + '</description>',
            '<Point><coordinates>' + stop.lng + ',' + stop.lat + '</coordinates></Point>',
            '</Placemark>'
          ].join("");
        }).join("");

        const coordinates = (route.coordinates || [])
          .map((coordinate) => coordinate.lng + ',' + coordinate.lat)
          .join(' ');
        const path = coordinates ? [
          '<Placemark>',
          '<name>' + escapeXml(route.routeName + ' 경로') + '</name>',
          '<styleUrl>#' + escapeXml(styleId) + '</styleUrl>',
          '<description>' + escapeXml(formatDistance(route.totalDistanceMeters || route.estimatedDistanceMeters) + ' / ' + formatDuration(route.totalDurationSeconds || route.estimatedDurationSeconds)) + '</description>',
          '<LineString><tessellate>1</tessellate><coordinates>' + coordinates + '</coordinates></LineString>',
          '</Placemark>'
        ].join("") : "";

        return '<Folder><name>' + escapeXml(route.routeName) + '</name>' + stops + path + '</Folder>';
      }).join("");

      return '<?xml version="1.0" encoding="UTF-8"?>' +
        '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>optimized-routes.kml</name>' +
        styles + folders + '</Document></kml>';
    }

    async function saveOptimizedKml() {
      const kmlContent = buildPreviewKml();
      const fileName = 'optimized-routes.kml';
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'KML file', accept: { 'application/vnd.google-earth.kml+xml': ['.kml'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(kmlContent);
        await writable.close();
        return;
      }
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function renderRoutePanels() {
      byId("route-list").innerHTML = DATA.routes.map((route, index) => {
        return [
          '<section class="route-panel">',
          '<label class="route-head">',
          '<input type="checkbox" data-route-toggle="' + escapeHtml(route.id) + '" checked>',
          '<div class="route-title">',
          '<strong style="color:' + route.color + ';">' + escapeHtml(route.routeName) + '</strong>',
          '<div class="route-meta">거리 ' + formatDistance(route.totalDistanceMeters || route.estimatedDistanceMeters) + ' / 시간 ' + formatDuration(route.totalDurationSeconds || route.estimatedDurationSeconds) + '</div>',
          '<div class="route-meta">환승 허브: ' + escapeHtml(route.hubStopName) + '</div>',
          '<div class="route-meta">정류장 방향: ' + escapeHtml(route.serviceSide === "left" ? "좌측 정류장군 역순환" : "우측 정류장군 순환") + '</div>',
          (route.optimizationIssues || []).length ? '<div class="route-meta" style="color:#b45309;">제약 미충족: ' + escapeHtml(route.optimizationIssues.join(', ')) + '</div>' : '',
          '</div>',
          '</label>',
          '<ol class="stop-list">' +
            route.stops.map((stop, stopIndex) => '<li>' + escapeHtml((stopIndex + 1) + '. ' + stop.name) + '</li>').join("") +
          '</ol>',
          '</section>'
        ].join("");
      }).join("");
    }

    function loadSdk() {
      return new Promise((resolve, reject) => {
        if (!APP_KEY) {
          reject(new Error("config.js의 카카오 JavaScript 키가 필요합니다."));
          return;
        }
        const script = document.createElement("script");
        script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + encodeURIComponent(APP_KEY) + "&autoload=false";
        script.onload = () => window.kakao.maps.load(resolve);
        script.onerror = () => reject(new Error("카카오맵 SDK를 불러오지 못했습니다."));
        document.head.appendChild(script);
      });
    }

    function renderMap() {
      const firstRoute = DATA.routes[0] || { stops: [] };
      const center = firstRoute.stops[0] || DATA.transferHubs[0] || { lat: 37.5665, lng: 126.9780 };
      const map = new window.kakao.maps.Map(document.getElementById("map"), {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 7,
      });
      const bounds = new window.kakao.maps.LatLngBounds();
      const infoWindow = new window.kakao.maps.InfoWindow();
      const layers = new Map();

      DATA.routes.forEach((route) => {
        const color = route.color;
        const path = (route.coordinates || []).map((coordinate) => {
          const latLng = new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng);
          bounds.extend(latLng);
          return latLng;
        });
        const markers = [];
        let polyline = null;
        if (path.length) {
          polyline = new window.kakao.maps.Polyline({
            map,
            path,
            strokeWeight: 6,
            strokeColor: color,
            strokeOpacity: 0.9,
            strokeStyle: "solid",
          });
          window.kakao.maps.event.addListener(polyline, "click", (mouseEvent) => {
            const distanceText = formatDistance(route.totalDistanceMeters || route.estimatedDistanceMeters);
            const durationText = formatDuration(route.totalDurationSeconds || route.estimatedDurationSeconds);
            infoWindow.setContent('<div style="padding:8px 10px;font-size:12px;line-height:1.55;white-space:nowrap;"><strong>' + escapeHtml(route.routeName) + '</strong><br>거리 ' + distanceText + '<br>운행시간 ' + durationText + '</div>');
            infoWindow.setPosition(mouseEvent.latLng);
            infoWindow.open(map);
          });
        }
        (route.uniqueStops || route.stops).forEach((stop, stopIndex) => {
          const markerPosition = new window.kakao.maps.LatLng(stop.lat, stop.lng);
          bounds.extend(markerPosition);
          const marker = new window.kakao.maps.Marker({
            map,
            position: markerPosition,
            title: stop.name,
          });
          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.setContent('<div style="padding:8px 10px;font-size:12px;line-height:1.5;"><strong>' + escapeHtml(route.routeName) + '</strong><br>' + (stopIndex + 1) + '. ' + escapeHtml(stop.name) + '<br>' + escapeHtml(stop.sourceRoutes.join(', ')) + '</div>');
            infoWindow.open(map, marker);
          });
          markers.push(marker);
        });
        layers.set(route.id, { route, polyline, markers });
      });
      if (!bounds.isEmpty()) {
        map.setBounds(bounds);
      }

      function setRouteVisible(routeId, visible) {
        const layer = layers.get(routeId);
        if (!layer) {
          return;
        }
        layer.route.visible = visible;
        if (layer.polyline) {
          layer.polyline.setMap(visible ? map : null);
        }
        layer.markers.forEach((marker) => marker.setMap(visible ? map : null));
      }

      renderRoutePanels();
      document.querySelectorAll("[data-route-toggle]").forEach((input) => {
        input.addEventListener("change", (event) => {
          setRouteVisible(event.target.getAttribute("data-route-toggle"), event.target.checked);
        });
      });

      const toggleAllButton = byId("toggle-all-routes");
      let allVisible = true;
      toggleAllButton.addEventListener("click", () => {
        allVisible = !allVisible;
        DATA.routes.forEach((route) => setRouteVisible(route.id, allVisible));
        document.querySelectorAll("[data-route-toggle]").forEach((input) => {
          input.checked = allVisible;
        });
        toggleAllButton.textContent = allVisible ? "전체 해제" : "전체 선택";
      });

      byId("save-optimized-kml").addEventListener("click", async () => {
        try {
          await saveOptimizedKml();
        } catch (error) {
          window.alert(error && error.name === "AbortError" ? "KML 저장을 취소했습니다." : (error.message || "KML 저장 중 오류가 발생했습니다."));
        }
      });
    }

    loadSdk().then(renderMap).catch((error) => {
      document.body.innerHTML = '<div style="padding:24px;font-family:Segoe UI,Noto Sans KR,sans-serif;">' + error.message + '</div>';
    });
  </script>
</body>
</html>`;
  }

  function renderOptimizationPreviewWindow(previewWindow, plan) {
    if (!previewWindow || previewWindow.closed) {
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildOptimizationPreviewHtml(plan, config.appKey));
    previewWindow.document.close();
  }

  function renderOptimizationModal(plan) {
    const duplicateItems = plan.duplicateGroups
      .slice(0, 12)
      .map((group) => `<li>${escapeHtml(group.points.map((point) => `${point.routeName} / ${point.name}`).join(", "))} (${escapeHtml(String(group.distanceMeters))}m)</li>`)
      .join("");
    const routeItems = plan.routes
      .slice(0, 20)
      .map((route) => `<li><strong>${escapeHtml(route.routeName)}</strong> <span class="analysis-inline-meta">${escapeHtml(`${formatDistanceKm(route.estimatedDistanceMeters)}km / ${formatDurationMinutes(route.estimatedDurationSeconds)}분`)}</span>${route.optimizationIssues?.length ? ` <span class="analysis-inline-meta">${escapeHtml(`제약 미충족: ${route.optimizationIssues.join(", ")}`)}</span>` : ""}<br>${escapeHtml(route.stops.map((stop) => stop.name).join(" -> "))}</li>`)
      .join("");
    const hubItems = plan.transferHubs
      .map((hub) => `<li>${escapeHtml(hub.name)} <span class="analysis-inline-meta">${escapeHtml(hub.sourceRoutes.join(", "))}</span></li>`)
      .join("");

    analysisModalBodyEl.innerHTML = `
      <div class="analysis-grid">
        <div class="analysis-stat">
          <span>원본 정류장</span>
          <strong>${escapeHtml(String(plan.originalPointCount))}</strong>
        </div>
        <div class="analysis-stat">
          <span>최적화 정류장</span>
          <strong>${escapeHtml(String(plan.optimizedStopCount))}</strong>
        </div>
        <div class="analysis-stat">
          <span>통합된 정류장</span>
          <strong>${escapeHtml(String(plan.removedStopCount))}</strong>
        </div>
        <div class="analysis-stat">
          <span>최대 환승</span>
          <strong>${escapeHtml(String(plan.maxTransfers))}</strong>
        </div>
      </div>
      <div class="analysis-list-card">
        <h3>최적화 결과</h3>
        <p>${escapeHtml(`${plan.sourceRouteCount}개 기존 노선을 기반으로 ${plan.routes.length}개 순환 노선을 다시 구성했습니다. 각 노선은 12km/60분 제한 안에서 시작과 끝이 같은 구조를 유지합니다.`)}</p>
        <div class="modal-actions">
          <button id="open-optimization-preview-button" class="primary-button" type="button">새 창에서 보기</button>
        </div>
      </div>
      <div class="analysis-list-card">
        <h3>환승 허브</h3>
        <ul>${hubItems || "<li>환승 허브가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 정류장 그룹</h3>
        <ul>${duplicateItems || "<li>중복 그룹이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>최적화 노선</h3>
        <ul>${routeItems || "<li>노선이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>설계 원칙</h3>
        <ul>
          <li>기존 정류장을 최대한 커버</li>
          <li>중복 정류장은 대표 정류장으로 통합</li>
          <li>지하철역을 환승 허브로 우선 사용</li>
          <li>공공시설, 복지시설, 주민센터, 구청, 시청 같은 중요 목적지 우선 포함</li>
          <li>각 노선은 순환형이며 12km/60분 제한 적용</li>
          <li>모든 노선은 최대 2회 환승 이내 연결을 목표로 설계</li>
        </ul>
      </div>
    `;

    const previewButton = document.getElementById("open-optimization-preview-button");
    if (previewButton) {
      previewButton.addEventListener("click", () => {
        const previewWindow = window.open("", "_blank", "width=1400,height=900");
        if (!previewWindow) {
          setStatus("새 창이 차단되었습니다. 팝업 차단을 해제하고 다시 시도하세요.", true);
          return;
        }
        renderOptimizationPreviewWindow(previewWindow, latestOptimizationPlan);
      });
    }

    analysisModalEl.classList.remove("is-hidden");
    analysisModalEl.setAttribute("aria-hidden", "false");
  }

  async function handleOptimizeRoutes() {
    if (!OPTIMIZATION_FEATURE_ENABLED) {
      setStatus("최적화 기능은 현재 보류 상태입니다.", true);
      return;
    }

    const pointCount = getAllPoints().length;
    if (pointCount < 2) {
      setStatus("최적화를 하려면 정류장이 2개 이상 필요합니다.", true);
      return;
    }

    const previewWindow = window.open("", "_blank", "width=1400,height=900");
    if (previewWindow) {
      previewWindow.document.write("<!DOCTYPE html><html lang='ko'><body style='font-family:Segoe UI,Noto Sans KR,sans-serif;padding:24px;'>최적화 경로를 계산하는 중입니다...</body></html>");
      previewWindow.document.close();
    }

    optimizeRoutesButtonEl.disabled = true;
    setStatus("중복 정류장을 통합하고 다중 순환 노선을 계산하는 중입니다.", false);

    try {
      const plan = buildOptimizationPlan();
      plan.routes = await materializeOptimizedRoutes(plan.routes);
      if (!plan.routes.length) {
        throw new Error("조건을 만족하는 최적화 노선을 생성하지 못했습니다. 정류장 분포를 다시 확인하세요.");
      }
      plan.maxTransfers = calculateMaxTransfers(plan.routes);
      latestOptimizationPlan = plan;

      renderOptimizationModal(plan);
      renderOptimizationPreviewWindow(previewWindow, plan);
      const issueRoutes = plan.routes.filter((route) => (route.optimizationIssues || []).length);
      if (issueRoutes.length) {
        setStatus(`최적화 결과를 생성했습니다. 다만 ${issueRoutes.length}개 노선은 일부 제약을 완전히 만족하지 못했습니다. 상세 내용은 결과 화면에서 확인하세요.`, true);
      } else if (plan.routes.length < 5 || plan.routes.length > 15) {
        setStatus(`최적화 결과 노선 수가 조건 범위(5~15개)를 만족하지 못했습니다. 현재 ${plan.routes.length}개입니다. 결과 화면은 표시했습니다.`, true);
      } else if (plan.routes.some((route) => !hasSharedTransferStop(route, plan.routes))) {
        setStatus("일부 노선이 공유 환승 정류장 조건을 완전히 만족하지 못했습니다. 결과 화면은 표시했습니다.", true);
      } else {
        setStatus(`${plan.routes.length}개 최적화 노선을 생성했습니다.`, false);
      }
    } catch (error) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.document.body.innerHTML = `<div style="font-family:Segoe UI,Noto Sans KR,sans-serif;padding:24px;">${escapeHtml(error.message || "최적화 중 오류가 발생했습니다.")}</div>`;
      }
      setStatus(error.message || "노선 최적화 중 오류가 발생했습니다.", true);
    } finally {
      optimizeRoutesButtonEl.disabled = false;
    }
  }

  function directChildrenByTag(parent, tagName) {
    return Array.from(parent.children).filter((child) => child.localName === tagName);
  }

  function directChildText(parent, tagName) {
    const node = directChildrenByTag(parent, tagName)[0];
    return node ? node.textContent.trim() : "";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeXml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function toKmlColor(hexColor, alpha = "ff") {
    const normalized = String(hexColor || "")
      .trim()
      .replace(/^#/, "")
      .toLowerCase();

    if (!/^[0-9a-f]{6}$/.test(normalized)) {
      return `${alpha}bd6c0f`;
    }

    const rr = normalized.slice(0, 2);
    const gg = normalized.slice(2, 4);
    const bb = normalized.slice(4, 6);
    return `${alpha}${bb}${gg}${rr}`;
  }

  function routeStyleId(routeName) {
    const normalized = normalizeRouteName(routeName)
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return `route-${normalized || "default"}`;
  }

  function buildRouteMetadataEntries(routeName) {
    const setting = getRouteSetting(routeName);
    const entries = [];
    if (setting.routeGroup === "merged" || setting.routeGroup === "default") {
      entries.push(`<Data name="routeGroup"><value>${escapeXml(setting.routeGroup)}</value></Data>`);
    }
    if (Number.isFinite(Number(setting.routeOrder))) {
      entries.push(`<Data name="routeOrder"><value>${escapeXml(String(setting.routeOrder))}</value></Data>`);
    }
    return entries;
  }

  function buildRouteStyle(routeName) {
    const setting = getRouteSetting(routeName);
    const styleId = routeStyleId(routeName);
    const lineColor = toKmlColor(setting.color, "ff");
    const iconColor = toKmlColor(setting.color, "ff");

    return `
      <Style id="${escapeXml(styleId)}">
        <IconStyle>
          <color>${iconColor}</color>
          <scale>1.1</scale>
          <Icon>
            <href>http://maps.google.com/mapfiles/kml/paddle/wht-circle.png</href>
          </Icon>
        </IconStyle>
        <LabelStyle>
          <scale>0.9</scale>
        </LabelStyle>
        <LineStyle>
          <color>${lineColor}</color>
          <width>4</width>
        </LineStyle>
      </Style>
    `.trim();
  }

  function pointToKml(point, styleId) {
    const dataEntries = buildRouteMetadataEntries(point.routeName).concat([
      point.fileName ? `<Data name="fileName"><value>${escapeXml(point.fileName)}</value></Data>` : "",
      point.description ? `<Data name="description"><value>${escapeXml(point.description)}</value></Data>` : "",
      normalizeRidershipValue(point.ridership) != null
        ? `<Data name="ridership"><value>${escapeXml(String(normalizeRidershipValue(point.ridership)))}</value></Data>`
        : "",
      Number.isFinite(Number(point.createdOrder))
        ? `<Data name="createdOrder"><value>${escapeXml(String(point.createdOrder))}</value></Data>`
        : "",
    ])
      .concat(
        withRidershipExtendedData(point.extendedData, null).map(
          (item) => `<Data name="${escapeXml(item.name)}"><value>${escapeXml(item.value)}</value></Data>`
        )
      )
      .filter(Boolean)
      .join("");

    const altitudePart = point.altitude == null ? "" : `,${point.altitude}`;
    return `
      <Placemark>
        <name>${escapeXml(point.name)}</name>
        ${styleId ? `<styleUrl>#${escapeXml(styleId)}</styleUrl>` : ""}
        ${point.description ? `<description>${escapeXml(point.description)}</description>` : ""}
        ${dataEntries ? `<ExtendedData>${dataEntries}</ExtendedData>` : ""}
        <Point>
          <coordinates>${point.lng},${point.lat}${altitudePart}</coordinates>
        </Point>
      </Placemark>
    `.trim();
  }

  function pathToKml(pathItem, styleId) {
    const coordinates = pathItem.coordinates
      .map((coordinate) =>
        coordinate.altitude == null
          ? `${coordinate.lng},${coordinate.lat}`
          : `${coordinate.lng},${coordinate.lat},${coordinate.altitude}`
      )
      .join(" ");
    const dataEntries = buildRouteMetadataEntries(pathItem.routeName).join("");

    return `
      <Placemark>
        <name>${escapeXml(pathItem.name)}</name>
        ${styleId ? `<styleUrl>#${escapeXml(styleId)}</styleUrl>` : ""}
        ${pathItem.description ? `<description>${escapeXml(pathItem.description)}</description>` : ""}
        ${dataEntries ? `<ExtendedData>${dataEntries}</ExtendedData>` : ""}
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coordinates}</coordinates>
        </LineString>
      </Placemark>
    `.trim();
  }

  function observationAreaToKml(area) {
    if (!Array.isArray(area?.points) || area.points.length < 3) {
      return "";
    }

    const coordinates = area.points
      .map((point) => `${point.lng},${point.lat},0`)
      .concat([`${area.points[0].lng},${area.points[0].lat},0`])
      .join(" ");
    const dataEntries = [
      '<Data name="observationArea"><value>true</value></Data>',
      `<Data name="color"><value>${escapeXml(normalizeHexColor(area.color, "#2f8cff"))}</value></Data>`,
      `<Data name="hidden"><value>${area.hidden === true ? "true" : "false"}</value></Data>`,
    ].join("");

    return `
      <Placemark>
        <name>${escapeXml(area.name || "관찰 구역")}</name>
        <ExtendedData>${dataEntries}</ExtendedData>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${coordinates}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    `.trim();
  }

  function getExportObservationAreas() {
    const merged = new Map();
    const currentAreas = Array.isArray(observationAreas) ? observationAreas : [];
    const persistedAreas = loadJsonArray(OBSERVATION_AREAS_KEY).map(normalizeObservationArea);

    currentAreas
      .concat(persistedAreas)
      .map(normalizeObservationArea)
      .filter((area) => Array.isArray(area.points) && area.points.length >= 3)
      .forEach((area) => {
        merged.set(area.id, area);
      });

    return Array.from(merged.values());
  }

  function buildCurrentKml() {
    const routes = getRoutes();
    const points = getAllPoints();
    const paths = getAllPaths();
    const exportObservationAreas = getExportObservationAreas();
    const styles = routes.map(buildRouteStyle).filter(Boolean).join("\n");

    const folders = routes
      .map((routeName) => {
        const routePoints = points.filter((point) => point.routeName === routeName).sort(comparePointsByOrder);
        const routePaths = paths.filter((pathItem) => pathItem.routeName === routeName);
        const styleId = routeStyleId(routeName);
        const placemarks = routePoints
          .map((point) => pointToKml(point, styleId))
          .concat(routePaths.map((pathItem) => pathToKml(pathItem, styleId)))
          .join("\n");

        if (!placemarks) {
          return "";
        }

        return `
          <Folder>
            <name>${escapeXml(routeName)}</name>
            ${placemarks}
          </Folder>
        `.trim();
      })
      .filter(Boolean)
      .join("\n");
    const observationAreaPlacemarks = exportObservationAreas
      .map((area) => observationAreaToKml(area))
      .filter(Boolean)
      .join("\n");
    const observationAreaFolder = observationAreaPlacemarks
      ? `
          <Folder>
            <name>${escapeXml("관찰 구역")}</name>
            ${observationAreaPlacemarks}
          </Folder>
        `.trim()
      : "";

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(AUTO_SAVE_FILENAME)}</name>
    ${styles}
    ${folders}
    ${observationAreaFolder}
  </Document>
</kml>`;
  }

  async function saveKmlToServer() {
    return saveNamedKmlToServer(AUTO_SAVE_FILENAME, "default");
  }

  function formatAutoSaveTimestamp(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  function buildTimedAutoSaveFileName() {
    return `${formatAutoSaveTimestamp()}.kml`;
  }

  async function saveNamedKmlToServer(fileName, storage = "default") {
    const response = await window.fetch("/api/save-kml", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        storage,
        content: buildCurrentKml(),
      }),
    });

    if (!response.ok) {
      throw new Error("자동 KML 저장에 실패했습니다.");
    }

    return response.json();
  }

  async function saveKmlWithPicker() {
    const kmlContent = buildCurrentKml();

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: AUTO_SAVE_FILENAME,
        types: [
          {
            description: "KML file",
            accept: {
              "application/vnd.google-earth.kml+xml": [".kml"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(kmlContent);
      await writable.close();
      return handle.name || AUTO_SAVE_FILENAME;
    }

    const blob = new Blob([kmlContent], {
      type: "application/vnd.google-earth.kml+xml;charset=utf-8",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = AUTO_SAVE_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    return AUTO_SAVE_FILENAME;
  }

  async function handleSaveKml() {
    try {
      const savedFileName = await saveKmlWithPicker();
      setStatus(`현재 내용을 ${savedFileName} 파일로 저장했습니다.`, false);
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("KML 저장을 취소했습니다.", false);
        return;
      }
      setStatus(error.message, true);
    }
  }

  function clearPersistedWorkspace() {
    window.localStorage.removeItem(CUSTOM_POINTS_KEY);
    window.localStorage.removeItem(CUSTOM_PATHS_KEY);
    window.localStorage.removeItem(OVERRIDES_KEY);
    window.localStorage.removeItem(PATH_OVERRIDES_KEY);
    window.localStorage.removeItem(ROUTE_SETTINGS_KEY);
    window.localStorage.removeItem(ROUTE_LIST_TITLES_KEY);
    window.localStorage.removeItem(UPLOADED_POINTS_KEY);
    window.localStorage.removeItem(UPLOADED_PATHS_KEY);
    window.localStorage.removeItem(UPLOADED_FILE_SUMMARIES_KEY);
    window.localStorage.removeItem(OBSERVATION_AREAS_KEY);
    window.localStorage.removeItem(UI_STATE_KEY);
  }

  function resetWorkspaceState() {
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }

    stopPathModes();
    stopRelocateMode();
    setAddPointMode(false);
    stopObservationAreaDrawMode();
    clearDraftMarker();

    uploadedPoints = [];
    uploadedPaths = [];
    uploadedFileSummaries = [];
    customPoints = [];
    customPaths = [];
    pointOverrides = {};
    pathOverrides = {};
    routeSettings = {};
    observationAreas = [];
    workingPathCoordinates = [];
    workingObservationAreaPoints = [];
    selectedRouteName = null;
    selectedPointId = null;
    selectedPathId = null;
    selectedObservationAreaId = null;
    selectedPathVertexIndex = null;
    hasClearedSelection = false;
    shouldFitMapToData = true;
    latestAnalysisReport = null;
    latestOptimizationPlan = null;
    analysisActive = false;

    fileInput.value = "";
    fileCountEl.textContent = "0";
    closeAnalysisModal();
    renderFileList([]);
    setEmptyDetails();
    setEmptyPathDetails();
    clearForm();
    fillPathForm(null);
    updateAnalyzeButtonState();
    refreshUI();
  }

  async function handleSaveAndReset() {
    try {
      const savedFileName = await saveKmlWithPicker();
      pushUndoSnapshot();
      clearPersistedWorkspace();
      resetWorkspaceState();
      setStatus(`${savedFileName} 저장 후 작업 공간을 초기화했습니다.`, false);
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("KML 저장 후 초기화를 취소했습니다.", false);
        return;
      }

      setStatus(error.message || "KML 저장 후 초기화 중 오류가 발생했습니다.", true);
    }
  }

  function clearAnalysisOverlays() {
    analysisMarkers.forEach((item) => item.setMap(null));
    analysisPolylines.forEach((item) => item.setMap(null));
    analysisCircles.forEach((item) => item.setMap(null));
    analysisInfoWindows.forEach((item) => item.close());
    analysisMarkers = [];
    analysisPolylines = [];
    analysisCircles = [];
    analysisInfoWindows = [];
  }

  function stopAnalysisView() {
    latestAnalysisReport = null;
    analysisActive = false;
    activeAnalysisGroup = null;
    clearAnalysisOverlays();
    closeAnalysisModal();
    updateAnalyzeButtonState();
    refreshUI();
  }

  function renderAnalysisOverlays(report) {
    clearAnalysisOverlays();
    if (!mapReady || !report) {
      return;
    }

    report.duplicatePoints.forEach((item) => {
      const visual = getDuplicateGroupVisual(item.points.length);
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(item.center.lat, item.center.lng),
        title: `중복 정류장 ${item.distanceMeters}m`,
        image: createMarkerImage(visual.stroke, true),
      });
      analysisMarkers.push(marker);
    });

  }

  function renderAnalysisRangeOverlays(report) {
    clearAnalysisOverlays();
    if (!mapReady || !report) {
      return;
    }

    report.duplicatePoints.forEach((item) => {
      const visual = getDuplicateGroupVisual(item.points.length);
      const center = new window.kakao.maps.LatLng(item.center.lat, item.center.lng);
      const groupLines = item.points
        .map((point) => `${escapeHtml(point.routeName)} / ${escapeHtml(point.name)}`)
        .join("<br>");
      const circle = new window.kakao.maps.Circle({
        map,
        center,
        radius: 30,
        strokeWeight: 2,
        strokeColor: visual.stroke,
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        fillColor: visual.fill,
        fillOpacity: 0.28,
      });
      const marker = new window.kakao.maps.Marker({
        map,
        position: center,
        title: `중복 정류장 범위 ${item.distanceMeters}m`,
        image: createMarkerImage(visual.stroke, true),
      });
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="display:inline-block;padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
            <strong>중복 정류장 후보</strong><br>
            ${escapeHtml(item.points[0].routeName)} / ${escapeHtml(item.points[0].name)}<br>
            ${escapeHtml(item.points[1].routeName)} / ${escapeHtml(item.points[1].name)}<br>
            거리: ${escapeHtml(String(item.distanceMeters))}m
          </div>
        `,
      });
      infoWindow.setContent(`
        <div style="display:inline-block;padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
          <strong>중복 정류장 그룹</strong><br>
          ${groupLines}<br>
          거리: ${escapeHtml(String(item.distanceMeters))}m<br>
          정류장 수: ${escapeHtml(String(item.points.length))}개
        </div>
      `);
      const openAnalysisInfo = () => {
        analysisInfoWindows.forEach((entry) => entry.close());
        infoWindow.open(map, marker);
      };
      window.kakao.maps.event.addListener(marker, "click", openAnalysisInfo);
      window.kakao.maps.event.addListener(circle, "click", openAnalysisInfo);
      analysisCircles.push(circle);
      analysisMarkers.push(marker);
      analysisInfoWindows.push(infoWindow);
    });

  }

  function buildLocalOptimizationActions(localReport) {
    const actions = [];

    if (localReport.duplicatePointCount > 0) {
      actions.push(`반경 30m 내 중복 정류장 ${localReport.duplicatePointCount}건을 우선 검토하세요.`);
    }
    if (localReport.overlappingSegmentCount > 0) {
      actions.push(`노선 간 겹치는 경로 구간 ${localReport.overlappingSegmentCount}건을 통합 가능 구간으로 검토하세요.`);
    }
    if (!actions.length) {
      actions.push("현재 기준에서는 중복 정류장이나 중복 경로 구간이 뚜렷하지 않습니다.");
    }

    return actions;
  }

  function buildLocalRiskNotes(localReport) {
    const risks = [];

    if (localReport.duplicatePointCount > 0) {
      risks.push("가까운 정류장은 실제로 같은 정류장일 수도 있고, 상하행 분리 정류장일 수도 있습니다.");
    }
    if (localReport.overlappingSegmentCount > 0) {
      risks.push("중복 경로 구간은 공용 회차나 필수 통행 구간일 수 있으므로 운영 목적을 함께 검토해야 합니다.");
    }
    if (!risks.length) {
      risks.push("현재 분석 기준에서는 추가 위험 신호가 두드러지지 않습니다.");
    }

    return risks;
  }

  function duplicateGroupLabel(item) {
    return item.points.map((point) => `${point.routeName} / ${point.name}`).join(", ");
  }

  function buildDirectionArrowHtml(color, angle) {
    return `
      <div style="
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%) rotate(${angle}deg);
        pointer-events: none;
        color: ${color};
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 0 2px rgba(255,255,255,0.95);
      ">&gt;
      </div>
    `;
  }

  function renderDirectionOverlaysForPath(coordinates, color, targetList) {
    if (!mapReady || !Array.isArray(coordinates) || coordinates.length < 2) {
      return;
    }

    const intervalMeters = 1300;
    const minSegmentMeters = 60;
    let distanceFromLastArrow = intervalMeters / 2;

    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const lengthMeters = segmentLengthMeters(start, end);

      if (lengthMeters < minSegmentMeters) {
        distanceFromLastArrow += lengthMeters;
        continue;
      }

      let cursor = Math.max(intervalMeters - distanceFromLastArrow, lengthMeters >= intervalMeters ? intervalMeters / 2 : lengthMeters / 2);
      while (cursor < lengthMeters) {
        const ratio = cursor / lengthMeters;
        const point = interpolateCoordinate(start, end, ratio);
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(point.lat, point.lng),
          content: buildDirectionArrowHtml(color, bearingDegrees(start, end)),
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 4,
        });
        overlay.setMap(map);
        targetList.push(overlay);
        cursor += intervalMeters;
      }

      distanceFromLastArrow = lengthMeters - (cursor - intervalMeters);
    }
  }

  function renderAnalysisModal(report) {
    const gpt = report.gpt || {};
    const duplicateItems = report.local.duplicatePoints
      .slice(0, 20)
      .map(
        (item) =>
          `<li>${escapeHtml(item.points[0].routeName)} / ${escapeHtml(item.points[0].name)} ↔ ${escapeHtml(
            item.points[1].routeName
          )} / ${escapeHtml(item.points[1].name)} (${escapeHtml(String(item.distanceMeters))}m)</li>`
      )
      .join("");
    const overlapItems = report.local.overlappingSegments
      .slice(0, 20)
      .map(
        (item) =>
          `<li>${escapeHtml(item.routeNames[0])} ↔ ${escapeHtml(item.routeNames[1])} (${escapeHtml(
            String(item.averageLengthMeters)
          )}m)</li>`
      )
      .join("");
    const gptActions = (gpt.optimization_actions || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const gptRisks = (gpt.risks || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const gptStopInsights = (gpt.duplicate_stop_insights || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const gptPathInsights = (gpt.overlapping_path_insights || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    analysisModalBodyEl.innerHTML = `
      <div class="analysis-grid">
        <div class="analysis-stat">
          <span>중복 정류장</span>
          <strong>${escapeHtml(String(report.local.duplicatePointCount))}건</strong>
        </div>
        <div class="analysis-stat">
          <span>중복 경로 구간</span>
          <strong>${escapeHtml(String(report.local.overlappingSegmentCount))}건</strong>
        </div>
      </div>
      <div class="analysis-list-card">
        <h3>GPT 요약</h3>
        <p>${escapeHtml(gpt.summary || report.message || "로컬 분석 결과만 생성했습니다.")}</p>
      </div>
      <div class="analysis-list-card">
        <h3>중복 정류장 목록</h3>
        <ul>${duplicateItems || "<li>중복 정류장이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 구간 목록</h3>
        <ul>${overlapItems || "<li>중복 경로 구간이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 정류장 해석</h3>
        <ul>${gptStopInsights || "<li>분석 결과가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 해석</h3>
        <ul>${gptPathInsights || "<li>분석 결과가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>최적화 제안</h3>
        <ul>${gptActions || "<li>제안이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>주의사항</h3>
        <ul>${gptRisks || "<li>추가 주의사항이 없습니다.</li>"}</ul>
      </div>
    `;
    if (duplicateItems) {
      analysisModalBodyEl.innerHTML = analysisModalBodyEl.innerHTML.replace(duplicateItems, duplicateItemsGrouped);
    }
    if (duplicateInsights) {
      analysisModalBodyEl.innerHTML = analysisModalBodyEl.innerHTML.replace(duplicateInsights, duplicateInsightsGrouped);
    }

    analysisModalEl.classList.remove("is-hidden");
    analysisModalEl.setAttribute("aria-hidden", "false");
  }

  function closeAnalysisModal() {
    analysisModalEl.classList.add("is-hidden");
    analysisModalEl.setAttribute("aria-hidden", "true");
  }

  function buildHelpWindowHtml() {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WONDER Linx 도움말</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #eef4fb;
      --panel: #ffffff;
      --line: #d5deea;
      --text: #203247;
      --muted: #667a90;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(47, 140, 255, 0.18), transparent 24%),
        linear-gradient(180deg, #f5f9ff, var(--bg));
      color: var(--text);
      font-family: "Segoe UI", "Malgun Gothic", "Noto Sans KR", sans-serif;
    }
    .help-shell {
      max-width: 860px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }
    .hero {
      padding: 22px 24px;
      border: 1px solid rgba(47, 140, 255, 0.18);
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(47, 140, 255, 0.14), rgba(255, 255, 255, 0.98));
      box-shadow: 0 18px 36px rgba(40, 72, 112, 0.1);
    }
    .hero h1 {
      margin: 0;
      font-size: 28px;
    }
    .hero p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.6;
    }
    .help-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .help-card {
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 14px 28px rgba(40, 72, 112, 0.06);
    }
    .help-card h2 {
      margin: 0 0 12px;
      font-size: 16px;
    }
    .help-card ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
      color: var(--muted);
      line-height: 1.6;
    }
    .help-card strong {
      color: var(--text);
    }
    .help-note {
      padding: 16px 18px;
      border: 1px solid #cfe0f6;
      border-radius: 16px;
      background: #edf5ff;
      color: #36597d;
      line-height: 1.6;
    }
    @media (max-width: 720px) {
      body { padding: 16px; }
      .help-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="help-shell">
    <section class="hero">
      <h1>WONDER Linx 도움말</h1>
      <p>KML 불러오기, 노선 편집, 병합, 경로 설계, 저장과 재불러오기 흐름을 빠르게 확인할 수 있는 요약 안내입니다.</p>
    </section>
    <section class="help-grid">
      <article class="help-card">
        <h2>파일 메뉴</h2>
        <ul>
          <li><strong>여러 KML 파일 드래그/선택:</strong> 파일을 불러와 지도와 리스트에 표시합니다.</li>
          <li><strong>KML 저장:</strong> 현재 작업 중인 노선, 정류장, 경로를 KML로 저장합니다.</li>
          <li><strong>저장후 초기화:</strong> 저장을 마친 뒤 현재 작업 공간을 비웁니다.</li>
          <li><strong>정류장 CSV 다운로드/업로드:</strong> 현재 표시 중인 정류장 목록을 엑셀용 CSV로 내보내고 boarding_count 열을 채워 다시 올리면 서버에 탑승객 수가 저장됩니다.</li>
          <li><strong>전체노선 비교분석:</strong> 기존노선과 개선노선의 전후 비교표를 새 창 대시보드로 엽니다.</li>
          <li><strong>불러온 파일 목록의 x:</strong> 해당 파일에서 온 데이터와 연결된 목록을 작업 화면에서 제거합니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>노선 메뉴</h2>
        <ul>
          <li><strong>모든 노선 표시/숨김:</strong> 전체 노선의 지도 표시 상태를 한 번에 바꿉니다.</li>
          <li><strong>기존노선과 노선리스트:</strong> 기본 노선들을 한 묶음 카드에서 보고 선택, 순서 변경, 색상 변경을 할 수 있습니다.</li>
          <li><strong>개선노선과 노선리스트:</strong> 병합으로 만든 개선 노선을 별도 묶음 카드에서 관리합니다.</li>
          <li><strong>노선 카드 총거리:</strong> 각 노선 카드에는 정류장 수, 경로 수와 함께 총 운행거리가 표시됩니다.</li>
          <li><strong>선택한 노선의 정류장:</strong> 현재 노선의 정류장 순서를 확인하고 이동할 수 있습니다.</li>
          <li><strong>정류장 탑승객 표시:</strong> 정류장 행과 상세 패널에 입력된 탑승객 수가 함께 표시됩니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>경로와 정류장 편집</h2>
        <ul>
          <li><strong>경로 추가:</strong> 지도를 클릭해 새 경로를 그리고 마지막 점을 다시 눌러 저장합니다.</li>
          <li><strong>경로 수정:</strong> 기존 경로의 점을 움직이거나 저장, 삭제할 수 있습니다.</li>
          <li><strong>빨간 끝점 연장:</strong> 빨간 끝점을 클릭하면 연속으로 경로를 이어갈 수 있고, 다시 클릭하면 저장 후 종료됩니다.</li>
          <li><strong>중간 점 수정 종료:</strong> 중간 점을 수정한 뒤 지도 빈 곳을 클릭하면 저장 후 수정 모드가 종료됩니다.</li>
          <li><strong>정류장 추가:</strong> 새 정류장을 선택한 노선에 넣습니다.</li>
          <li><strong>정류장 수정:</strong> 기존 정류장 정보를 바꾸거나 다른 노선으로 이동합니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>병합과 설계</h2>
        <ul>
          <li><strong>두 노선 병합:</strong> 공통 구간을 찾아 중복 정류장을 정리한 새 노선을 만듭니다. 기본 화면에서는 접혀 있고 열기 텍스트로 펼칠 수 있습니다.</li>
          <li><strong>단순병합:</strong> 공통 구간 판단 없이 두 노선 정류장을 순서대로 모두 합칩니다.</li>
          <li><strong>병합 결과 보기:</strong> 최근 병합한 노선을 즉시 다시 선택합니다.</li>
          <li><strong>경로 설계:</strong> 설계된 정류장을 기반으로 최적의 경로를 설계합니다.</li>
          <li><strong>접기 패널:</strong> 경로 설계와 관찰 구역 메뉴는 노선리스트 밖의 독립 패널이며, 기본 로드 시 접힌 상태로 시작합니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>지도 도구</h2>
        <ul>
          <li><strong>지역 검색:</strong> 장소명이나 주소로 지도를 이동하고 검색 마커를 표시합니다.</li>
          <li><strong>관찰 구역 그리기:</strong> 이름과 색상을 정한 뒤 지도에서 꼭짓점을 3개 이상 찍고 저장하면 반투명 구역이 만들어집니다.</li>
          <li><strong>관찰 구역 선택:</strong> 목록에서 구역을 클릭하면 해당 구역이 선택되고, 지도 위에서는 선택된 구역 이름만 표시됩니다.</li>
          <li><strong>선택 구역 저장:</strong> 이미 만든 구역의 이름과 색상도 다시 저장해서 바꿀 수 있습니다.</li>
          <li><strong>숨김/보기/삭제:</strong> 각 구역별로 지도 표시를 끄거나, 해당 위치로 이동하거나, 구역을 지울 수 있습니다.</li>
          <li><strong>구역 이동/수정:</strong> 이동 모드에서는 구역 자체를 드래그해 옮길 수 있고, 수정 모드에서는 꼭짓점을 드래그하거나 우클릭으로 포인트 추가/삭제가 가능합니다.</li>
          <li><strong>패널 열기/닫기:</strong> 관찰 구역 패널도 기본은 접혀 있으며, 텍스트형 열기/닫기로 펼칩니다.</li>
          <li><strong>분석 시작:</strong> 노선 중복, 겹침 구간, 운영상 주의 지점을 분석합니다.</li>
          <li><strong>Esc:</strong> 경로 편집, 정류장 추가, 일부 선택 상태를 빠르게 취소합니다.</li>
          <li><strong>지도 빈 공간 클릭:</strong> 현재 선택한 노선, 정류장, 경로 선택을 해제합니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>저장과 재불러오기</h2>
        <ul>
          <li><strong>KML 저장 후 재불러오기:</strong> 노선 순서와 기존/신규 리스트 구분이 함께 저장되도록 되어 있습니다.</li>
          <li><strong>병합 노선:</strong> 저장 후 다시 불러와도 병합된 노선 리스트 위치를 유지합니다.</li>
          <li><strong>관찰 구역:</strong> 현재 저장된 구역 이름, 색상, 숨김 상태도 KML에 함께 저장되고 다시 불러올 수 있습니다.</li>
          <li><strong>오래된 KML:</strong> 예전에 저장한 파일은 일부 최신 메타데이터가 없어 기본 방식으로 불러올 수 있습니다.</li>
        </ul>
      </article>
      <article class="help-card">
        <h2>작업 팁</h2>
        <ul>
          <li><strong>브라우저 새로고침 후 이상할 때:</strong> 캐시가 남을 수 있으니 한 번 더 새로고침해 최신 스크립트를 받으세요.</li>
          <li><strong>노선 순서 정리:</strong> 노선 리스트와 정류장 리스트는 드래그 또는 순서 입력으로 정리할 수 있습니다.</li>
          <li><strong>파일 삭제 전 확인:</strong> 연결된 사용자 편집 데이터도 같이 정리될 수 있으니 필요한 경우 먼저 저장하세요.</li>
        </ul>
      </article>
    </section>
    <section class="help-note">
      각 기능은 현재 화면 상태와 선택된 노선에 따라 비활성화될 수 있습니다. 버튼이 눌리지 않으면 먼저 노선 또는 정류장을 선택한 뒤 다시 시도하세요.
    </section>
  </div>
</body>
</html>`;
  }

  function openHelpWindow() {
    const helpWindow = window.open("", "wonder-linx-help", "popup=yes,width=860,height=920,resizable=yes,scrollbars=yes");
    if (!helpWindow) {
      setStatus("도움말 창이 차단되었습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도하세요.", true);
      return;
    }

    helpWindow.document.open();
    helpWindow.document.write(buildHelpWindowHtml());
    helpWindow.document.close();
    helpWindow.focus();
  }

  function renderLocalAnalysisModal(report) {
    const localActions = buildLocalOptimizationActions(report.local);
    const localRisks = buildLocalRiskNotes(report.local);
    const duplicateItems = report.local.duplicatePoints
      .slice(0, 20)
      .map(
        (item) =>
          `<li>${escapeHtml(item.points[0].routeName)} / ${escapeHtml(item.points[0].name)} ↔ ${escapeHtml(
            item.points[1].routeName
          )} / ${escapeHtml(item.points[1].name)} (${escapeHtml(String(item.distanceMeters))}m)</li>`
      )
      .join("");
    const overlapItems = report.local.overlappingSegments
      .slice(0, 20)
      .map(
        (item) =>
          `<li>${escapeHtml(item.routeNames[0])} ↔ ${escapeHtml(item.routeNames[1])} (${escapeHtml(
            String(item.averageLengthMeters)
          )}m)</li>`
      )
      .join("");
    const duplicateInsights = report.local.duplicatePoints
      .slice(0, 10)
      .map(
        (item) =>
          `<li>${escapeHtml(item.points[0].name)} / ${escapeHtml(item.points[1].name)} 이 ${escapeHtml(
            String(item.distanceMeters)
          )}m 이내에서 중복됩니다.</li>`
      )
      .join("");
    const overlapInsights = report.local.overlappingSegments
      .slice(0, 10)
      .map(
        (item) =>
          `<li>${escapeHtml(item.routeNames[0])} 와 ${escapeHtml(item.routeNames[1])} 사이에 ${escapeHtml(
            String(item.averageLengthMeters)
          )}m 중복 구간 후보가 있습니다.</li>`
      )
      .join("");
    const actionItems = localActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const riskItems = localRisks.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    analysisModalBodyEl.innerHTML = `
      <div class="analysis-grid">
        <div class="analysis-stat">
          <span>중복 정류장</span>
          <strong>${escapeHtml(String(report.local.duplicatePointCount))}건</strong>
        </div>
        <div class="analysis-stat">
          <span>중복 경로 구간</span>
          <strong>${escapeHtml(String(report.local.overlappingSegmentCount))}건</strong>
        </div>
      </div>
      <div class="analysis-list-card">
        <h3>분석 요약</h3>
        <p>${escapeHtml(report.message || "로컬 분석 결과를 생성했습니다.")}</p>
      </div>
      <div class="analysis-list-card">
        <h3>중복 정류장 목록</h3>
        <ul>${duplicateItems || "<li>중복 정류장이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 구간 목록</h3>
        <ul>${overlapItems || "<li>중복 경로 구간이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 정류장 해석</h3>
        <ul>${duplicateInsights || "<li>분석 결과가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 해석</h3>
        <ul>${overlapInsights || "<li>분석 결과가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>최적화 제안</h3>
        <ul>${actionItems || "<li>제안이 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>주의사항</h3>
        <ul>${riskItems || "<li>추가 주의사항이 없습니다.</li>"}</ul>
      </div>
    `;

    analysisModalEl.classList.remove("is-hidden");
    analysisModalEl.setAttribute("aria-hidden", "false");
  }

  async function saveAnalysisReport(report) {
    const response = await window.fetch("/api/save-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ report }),
    });

    if (!response.ok) {
      throw new Error("analysis-report.json ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.");
    }

    return response.json();
  }

  async function requestDesignedRoute(routeName, points, options = {}) {
    const response = await window.fetch("/api/design-route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routeName,
        options,
        points: points.map((point) => ({
          id: point.id,
          name: point.name,
          lat: point.lat,
          lng: point.lng,
        })),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "노선 설계 요청이 실패했습니다.");
    }

    return response.json();
  }

  function chooseBestDesignedRoute(routes, designOptions) {
    if (!Array.isArray(routes) || !routes.length) {
      return null;
    }

    const priority = designOptions.priority || "RECOMMEND";
    if (priority === "RECOMMEND") {
      return { route: routes[0], index: 0, score: 0 };
    }
    const scored = routes.map((route, index) => {
      const summary = route?.summary || {};
      const distance = Number(summary.distance) || Number.MAX_SAFE_INTEGER;
      const duration = Number(summary.duration) || Number.MAX_SAFE_INTEGER;
      const score = priority === "TIME" ? duration * 1000 + distance : distance * 1000 + duration;
      return { route, index, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored[0] || null;
  }

  function convertVertexesToCoordinates(vertexes) {
    const coordinates = [];
    for (let index = 0; index < vertexes.length - 1; index += 2) {
      const lng = Number(vertexes[index]);
      const lat = Number(vertexes[index + 1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coordinates.push({
          lat,
          lng,
          altitude: null,
        });
      }
    }
    return coordinates;
  }

  function extractDesignedRouteCoordinates(payload, routeIndex = 0) {
    const coordinates = [];
    const route = (payload.routes || [])[routeIndex];
    (route?.sections || []).forEach((section) => {
      (section.roads || []).forEach((road) => {
        coordinates.push(...convertVertexesToCoordinates(road.vertexes || []));
      });
    });

    const deduped = [];
    coordinates.forEach((coordinate) => {
      const last = deduped[deduped.length - 1];
      if (!last || last.lat !== coordinate.lat || last.lng !== coordinate.lng) {
        deduped.push(coordinate);
      }
    });
    return deduped;
  }

  function extractDesignedRouteSectionCoordinates(payload, routeIndex = 0, sectionIndex = 0) {
    const coordinates = [];
    const section = payload?.routes?.[routeIndex]?.sections?.[sectionIndex];
    (section?.roads || []).forEach((road) => {
      coordinates.push(...convertVertexesToCoordinates(road.vertexes || []));
    });

    const deduped = [];
    coordinates.forEach((coordinate) => {
      const last = deduped[deduped.length - 1];
      if (!last || last.lat !== coordinate.lat || last.lng !== coordinate.lng) {
        deduped.push(coordinate);
      }
    });
    return deduped;
  }

  function buildPointSequenceCoordinates(points) {
    return points
      .map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
        altitude: null,
      }))
      .filter((coordinate) => Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng));
  }

  function extractDesignedRouteSummary(payload, routeIndex = 0) {
    const summary = payload?.routes?.[routeIndex]?.summary || {};
    return {
      totalDistanceMeters: Number(summary.distance) || 0,
      totalDurationSeconds: Number(summary.duration) || 0,
    };
  }

  function extractDesignedRouteSectionSummary(payload, routeIndex = 0, sectionIndex = 0) {
    const section = payload?.routes?.[routeIndex]?.sections?.[sectionIndex] || {};
    return {
      totalDistanceMeters: Number(section.distance) || 0,
      totalDurationSeconds: Number(section.duration) || 0,
    };
  }

  function densifyPathCoordinates(coordinates, spacingMeters = 50) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return Array.isArray(coordinates) ? coordinates.map((coordinate) => ({ ...coordinate })) : [];
    }

    const densified = [{ ...coordinates[0] }];
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const segmentLength = segmentLengthMeters(start, end);

      if (segmentLength > spacingMeters) {
        const insertCount = Math.floor(segmentLength / spacingMeters);
        for (let step = 1; step <= insertCount; step += 1) {
          const ratio = (spacingMeters * step) / segmentLength;
          if (ratio >= 1) {
            break;
          }
          densified.push({
            ...interpolateCoordinate(start, end, ratio),
            altitude: null,
          });
        }
      }

      densified.push({ ...end });
    }

    return densified;
  }

  function convertDesignedPathToEditablePath(pathItem) {
    const editableCoordinates = densifyPathCoordinates(pathItem.coordinates, 50);
    if (editableCoordinates.length < 2) {
      throw new Error("\uC124\uACC4 \uB178\uC120\uC744 \uD3B8\uC9D1\uD560 \uC218 \uC788\uB294 \uACBD\uB85C\uB85C \uBCC0\uD658\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }

    pushUndoSnapshot();
    const editablePath = {
      id: `custom-path-${Date.now()}`,
      source: "custom-path",
      routeName: pathItem.routeName,
      fileName: "\uC9C1\uC811 \uCD94\uAC00",
      name: pathItem.name,
      description: pathItem.description,
      coordinates: editableCoordinates,
      rawCoordinates: editableCoordinates.map((coordinate) => `${coordinate.lng},${coordinate.lat}`).join(" "),
      designedRoute: false,
      deleted: false,
    };

    customPaths = customPaths.filter((item) => item.id !== pathItem.id);
    customPaths.unshift(editablePath);
    saveCustomPaths();

    selectedRouteName = editablePath.routeName;
    selectedPathId = editablePath.id;
    selectedPointId = null;
    drawPathMode = false;
    editPathMode = true;
    pathExtendMode = false;
    selectedPathVertexIndex = null;
    workingPathCoordinates = editablePath.coordinates.map((coordinate) => ({ ...coordinate }));
    fillPathForm(editablePath);
    updatePathEditorUi();
    syncPathPreview();
    refreshUI();
    setStatus(
      "\uC124\uACC4 \uB178\uC120\uC744 \uC9C1\uC811 \uADF8\uB9B0 \uACBD\uB85C\uB85C \uBCC0\uD658\uD588\uC2B5\uB2C8\uB2E4. 50m \uAC04\uACA9 \uD3B8\uC9D1\uC810\uC73C\uB85C \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
      false
    );
  }

  function buildVillageBusDesignAttempts(baseSetting) {
    const normalized = normalizeVillageBusDesignSettings(baseSetting);
    const selected = {
      priority: normalized.priority,
      avoid: normalized.avoid,
    };
    const recommended = {
      priority: "RECOMMEND",
    };
    const relaxedTime = {
      priority: "TIME",
    };
    const relaxedDistance = {
      priority: "DISTANCE",
    };

    return [
      {
        label: "선택 옵션",
        options: selected,
      },
      {
        label: "추천 경로 재시도",
        options: recommended,
      },
      {
        label: "시간 우선 재시도",
        options: relaxedTime,
      },
      {
        label: "거리 우선 재시도",
        options: relaxedDistance,
      },
    ].filter((attempt, index, attempts) => {
      const key = JSON.stringify(attempt.options);
      return attempts.findIndex((item) => JSON.stringify(item.options) === key) === index;
    });
  }

  function buildDesignedPathDescription(modeLabel, usedFallback, selectedOption) {
    if (usedFallback) {
      return `${modeLabel}: 카카오 응답이 불완전해 정류장 순서를 기준으로 직선 연결한 경로`;
    }
    const avoid = Array.isArray(selectedOption.avoid) && selectedOption.avoid.length
      ? ` / 회피: ${selectedOption.avoid.join(", ")}`
      : "";
    return `${modeLabel}: 카카오모빌리티 경로 결과 반영 / 우선순위 ${selectedOption.priority}${avoid}`;
  }

  async function designRouteWithOptions(routeName, routePoints, baseDesignOptions, modeLabel, triggerButtonEl) {
    triggerButtonEl.disabled = true;
    setStatus(`"${routeName}" ${modeLabel}을 시작합니다. 정류장 순서는 유지한 채 경로를 계산합니다.`, false);

    try {
      const attempts = buildVillageBusDesignAttempts(baseDesignOptions);
      let selectedOptions = normalizeVillageBusDesignSettings(baseDesignOptions);
      let designedRoute = null;

      for (const attempt of attempts) {
        const candidateDesignedRoute = await requestDesignedRouteInBatches(routeName, routePoints, attempt.options);
        if (candidateDesignedRoute.coordinates.length >= 2) {
          designedRoute = candidateDesignedRoute;
          selectedOptions = attempt.options;
          break;
        }
      }

      if (!designedRoute) {
        throw new Error("카카오 경로 응답에서 사용할 수 있는 경로를 찾지 못했습니다.");
      }

      let coordinates = designedRoute.coordinates;
      let usedFallback = designedRoute.usedFallback === true;
      const summary = {
        totalDistanceMeters: designedRoute.totalDistanceMeters,
        totalDurationSeconds: designedRoute.totalDurationSeconds,
      };

      if (coordinates.length < 2) {
        coordinates = buildPointSequenceCoordinates(routePoints);
        usedFallback = true;
      }

      if (coordinates.length < 2) {
        throw new Error("설계 결과에서 경로 좌표를 충분히 받지 못했습니다.");
      }

      pushUndoSnapshot();
      customPaths = customPaths.filter(
        (pathItem) => !(pathItem.routeName === routeName && pathItem.designedRoute === true)
      );

      const designedPath = {
        id: `designed-route-${routeName}-${Date.now()}`,
        source: "custom-path",
        routeName,
        fileName: "노선 설계",
        name: `${routeName} 설계 노선`,
        description: buildDesignedPathDescription(modeLabel, usedFallback, selectedOptions),
        coordinates,
        rawCoordinates: coordinates.map((item) => `${item.lng},${item.lat}`).join(" "),
        totalDistanceMeters: summary.totalDistanceMeters,
        totalDurationSeconds: summary.totalDurationSeconds,
        designedRoute: true,
        deleted: false,
      };

      customPaths.unshift(designedPath);
      saveCustomPaths();
      shouldFitMapToData = false;
      selectedPointId = null;
      selectedPathId = designedPath.id;
      refreshUI();

      const warnings = [];
      if (summary.totalDistanceMeters > 25000) {
        warnings.push(`총거리 ${formatDistanceKm(summary.totalDistanceMeters)}km`);
      }
      if (summary.totalDurationSeconds > 5400) {
        warnings.push(`총시간 ${formatDurationMinutes(summary.totalDurationSeconds)}분`);
      }

      const warningText = warnings.length ? ` 다만 ${warnings.join(", ")}로 길게 계산되었습니다.` : "";
      setStatus(`"${routeName}" ${modeLabel}을 완료했습니다.${warningText}`, warnings.length > 0);
    } catch (error) {
      setStatus(error.message || "노선 설계 중 오류가 발생했습니다.", true);
    } finally {
      triggerButtonEl.disabled = false;
    }
  }

  async function handleDesignRoute() {
    if (!selectedRouteName) {
      setStatus("\uB178\uC120\uC744 \uBA3C\uC800 \uC120\uD0DD\uD558\uC138\uC694.", true);
      return;
    }

    const routePoints = getPointsInSelectedRoute();
    if (routePoints.length < 2) {
      setStatus("\uB178\uC120 \uC124\uACC4\uB97C \uD558\uB824\uBA74 \uAC19\uC740 \uB178\uC120\uC5D0 \uD3EC\uC778\uD2B8\uAC00 2\uAC1C \uC774\uC0C1 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4.", true);
      return;
    }

    await designRouteWithOptions(
      selectedRouteName,
      routePoints,
      {
        priority: "RECOMMEND",
        avoid: [],
        roadevent: 1,
        alternatives: false,
        roadDetails: true,
        carType: 1,
        carFuel: "GASOLINE",
        carHipass: false,
      },
      "기본 노선 설계",
      designRouteButtonEl
    );
  }

  async function handleVillageBusDesignRoute(triggerButtonEl = designVillageBusRouteButtonEl) {
    if (!selectedRouteName) {
      setStatus("노선을 먼저 선택하세요.", true);
      return;
    }

    const routePoints = getPointsInSelectedRoute();
    if (routePoints.length < 2) {
      setStatus("마을버스 설계를 하려면 같은 노선에 포인트가 2개 이상 있어야 합니다.", true);
      return;
    }

    const current = getRouteSetting(selectedRouteName).villageBusDesign;
    await designRouteWithOptions(selectedRouteName, routePoints, current, "마을버스 설계", triggerButtonEl);
  }

  function handleResetDesignedRoute() {
    if (!selectedRouteName) {
      setStatus("노선을 먼저 선택하세요.", true);
      return;
    }

    const designedPaths = customPaths.filter(
      (pathItem) => pathItem.routeName === selectedRouteName && pathItem.designedRoute === true
    );
    if (!designedPaths.length) {
      setStatus("초기화할 설계 노선이 없습니다.", true);
      return;
    }

    const confirmed = window.confirm(`"${selectedRouteName}" 설계 노선을 초기화하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();
    customPaths = customPaths.filter(
      (pathItem) => !(pathItem.routeName === selectedRouteName && pathItem.designedRoute === true)
    );
    if (selectedPathId && designedPaths.some((pathItem) => pathItem.id === selectedPathId)) {
      selectedPathId = null;
    }
    saveCustomPaths();
    refreshUI();
    setStatus(`"${selectedRouteName}" 설계 노선을 초기화했습니다.`, false);
  }

  async function requestRouteAnalysis(dataset, localReport) {
    const response = await window.fetch("/api/analyze-routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataset,
        localReport,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "노선 분석 요청에 실패했습니다.");
    }

    return response.json();
  }

  async function handleAnalyzeRoutes() {
    const pointCount = getAllPoints().length;
    const pathCount = getAllPaths().length;

    if (!pointCount && !pathCount) {
      setStatus("분석할 노선 데이터가 없습니다.", true);
      return;
    }

    analyzeRoutesButtonEl.disabled = true;
    setStatus("노선 분석을 시작합니다.", false);

    try {
      const dataset = buildAnalysisDataset();
      const localReport = summarizeLocalAnalysis();
      const analysisResponse = await requestRouteAnalysis(dataset, localReport);
      const report = {
        generatedAt: new Date().toISOString(),
        datasetSummary: {
          routeCount: dataset.routes.length,
          pointCount,
          pathCount,
        },
        local: localReport,
        gpt: analysisResponse.gpt,
        model: analysisResponse.model,
        message: analysisResponse.message,
      };

      latestAnalysisReport = report;
      renderAnalysisRangeOverlays(localReport);
      renderAnalysisModal(report);
      await saveAnalysisReport(report);
      setStatus("노선 분석이 완료되었고 analysis-report.json으로 저장했습니다.", false);
    } catch (error) {
      setStatus(error.message || "노선 분석 중 오류가 발생했습니다.", true);
    } finally {
      analyzeRoutesButtonEl.disabled = false;
    }
  }

  async function handleAnalyzeRoutesLocal() {
    if (analysisActive) {
      stopAnalysisView();
      setStatus("분석을 종료하고 이전 화면으로 돌아갔습니다.", false);
      return;
    }

    const pointCount = getAllPoints().length;
    const pathCount = getAllPaths().length;

    if (!pointCount && !pathCount) {
      setStatus("분석할 노선 데이터가 없습니다.", true);
      return;
    }

    analyzeRoutesButtonEl.disabled = true;
    setStatus("노선 로컬 분석을 시작합니다.", false);

    try {
      const dataset = buildAnalysisDataset();
      const localReport = summarizeLocalAnalysis();
      const report = {
        generatedAt: new Date().toISOString(),
        datasetSummary: {
          routeCount: dataset.routes.length,
          pointCount,
          pathCount,
        },
        local: localReport,
        message: `노선 ${dataset.routes.length}개, 정류장 ${pointCount}개, 경로 ${pathCount}개를 기준으로 로컬 분석을 완료했습니다.`,
      };

      latestAnalysisReport = report;
      analysisActive = true;
      renderAnalysisRangeOverlays(localReport);
      renderLocalAnalysisModal(report);
      await saveAnalysisReport(report);
      updateAnalyzeButtonState();
      setStatus("노선 로컬 분석이 완료되었고 analysis-report.json으로 저장했습니다.", false);
    } catch (error) {
      setStatus(error.message || "노선 로컬 분석 중 오류가 발생했습니다.", true);
    } finally {
      analyzeRoutesButtonEl.disabled = false;
    }
  }

  async function handleAnalyzeRouteGroup(groupKey, triggerButtonEl) {
    if (analysisActive && activeAnalysisGroup === groupKey) {
      stopAnalysisView();
      setStatus("분석 내용을 초기화했습니다.", false);
      return;
    }

    const routeNames = getRouteNamesByGroup(groupKey);
    const pointCount = getAllPoints().filter((point) => routeNames.includes(point.routeName)).length;
    const pathCount = getAllPaths().filter((pathItem) => routeNames.includes(pathItem.routeName)).length;
    const groupLabel = groupKey === "merged" ? "신규 노선" : "기존 노선";

    if (!routeNames.length || (!pointCount && !pathCount)) {
      setStatus(`${groupLabel} 목록에 분석할 노선 데이터가 없습니다.`, true);
      return;
    }

    if (triggerButtonEl) {
      triggerButtonEl.disabled = true;
    }
    setStatus(`${groupLabel} 목록 분석을 시작합니다.`, false);

    try {
      if (analysisActive) {
        stopAnalysisView();
      }
      const dataset = buildAnalysisDataset(routeNames);
      const localReport = summarizeLocalAnalysis(routeNames);
      const report = {
        generatedAt: new Date().toISOString(),
        datasetSummary: {
          routeCount: dataset.routes.length,
          pointCount,
          pathCount,
        },
        local: localReport,
        message: `${groupLabel} ${dataset.routes.length}개, 정류장 ${pointCount}개, 경로 ${pathCount}개를 기준으로 로컬 분석을 완료했습니다.`,
      };

      latestAnalysisReport = report;
      analysisActive = true;
      activeAnalysisGroup = groupKey;
      renderAnalysisRangeOverlays(localReport);
      renderLocalAnalysisModal(report);
      await saveAnalysisReport(report);
      updateAnalyzeButtonState();
      setStatus(`${groupLabel} 목록 분석이 완료되었고 analysis-report.json으로 저장했습니다.`, false);
    } catch (error) {
      setStatus(error.message || `${groupLabel} 목록 분석 중 오류가 발생했습니다.`, true);
    } finally {
      if (triggerButtonEl) {
        triggerButtonEl.disabled = false;
      }
      updateAnalyzeButtonState();
    }
  }

  async function handleCompareRouteGroups() {
    const existingRouteNames = getRouteNamesByGroup("default");
    const improvedRouteNames = getRouteNamesByGroup("merged");

    if (!existingRouteNames.length || !improvedRouteNames.length) {
      setStatus("전체노선 비교분석을 하려면 기존노선과 개선노선이 모두 있어야 합니다.", true);
      return;
    }

    compareRouteGroupsButtonEl.disabled = true;
    setStatus("전체노선 비교분석 표를 생성합니다.", false);

    try {
      const report = buildRouteGroupComparisonReport();
      latestAnalysisReport = report;
      const opened = openRouteComparisonWindow(report);
      if (!opened) {
        return;
      }
      await saveAnalysisReport(report);
      setStatus("전체노선 비교분석 창을 열고 analysis-report.json으로 저장했습니다.", false);
    } catch (error) {
      setStatus(error.message || "전체노선 비교분석 중 오류가 발생했습니다.", true);
    } finally {
      compareRouteGroupsButtonEl.disabled = false;
    }
  }

  function scheduleAutoSaveKml() {
    if (autoSaveTimer) {
      return;
    }

    autoSaveTimer = window.setInterval(async () => {
      try {
        if (!getAllPoints().length && !getAllPaths().length) {
          return;
        }

        await saveNamedKmlToServer(buildTimedAutoSaveFileName(), "temp");
      } catch (error) {
        setStatus(error.message, true);
      }
    }, AUTO_SAVE_INTERVAL_MS);
  }

  function getPreferredOrigin() {
    if (window.location.hostname === "127.0.0.1") {
      return `http://localhost:${window.location.port || "8080"}`;
    }

    return window.location.origin;
  }

  function redirectToPreferredOrigin() {
    const preferredOrigin = getPreferredOrigin();
    if (preferredOrigin !== window.location.origin) {
      window.location.replace(
        `${preferredOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`
      );
      return true;
    }

    return false;
  }

  function loadKakaoMapSdk(appKey) {
    return new Promise((resolve, reject) => {
      if (!appKey || appKey.includes("PUT_YOUR_KAKAO_JAVASCRIPT_KEY_HERE")) {
        reject(new Error("카카오 JavaScript 키가 비어 있습니다."));
        return;
      }

      if (window.kakao && window.kakao.maps) {
        resolve(window.kakao);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
      script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
      script.onerror = () =>
        reject(
          new Error(
            `카카오맵 SDK를 불러오지 못했습니다. 현재 접속 주소 ${window.location.origin} 이 카카오 Developers JavaScript 키 허용 도메인에 등록되어 있는지 확인하세요.`
          )
        );
      document.head.appendChild(script);
    });
  }

  function initMap() {
    map = new window.kakao.maps.Map(document.getElementById("map"), {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 8,
    });
    if (window.kakao.maps.services && typeof window.kakao.maps.services.Places === "function") {
      mapSearchPlaces = new window.kakao.maps.services.Places();
    }
    mapSearchInfoWindow = new window.kakao.maps.InfoWindow({ removable: false });
    mapReady = true;
    window.kakao.maps.event.addListener(map, "click", handleMapClick);
    window.kakao.maps.event.addListener(map, "mousemove", handleObservationAreaDrag);
  }

  function clearMap() {
    markers.forEach((item) => item.marker.setMap(null));
    infoWindows.forEach((item) => item.close());
    polylines.forEach((item) => item.polyline.setMap(null));
    directionOverlays.forEach((item) => item.setMap(null));
    clearAnalysisOverlays();
    clearObservationAreaOverlays();
    markers = [];
    infoWindows = [];
    polylines = [];
    directionOverlays = [];
  }

  function clearPathEditorOverlay() {
    pathVertexMarkers.forEach((marker) => marker.setMap(null));
    pathVertexMarkers = [];
    pathPreviewDirectionOverlays.forEach((item) => item.setMap(null));
    pathPreviewDirectionOverlays = [];
    if (pathPreviewPolyline) {
      pathPreviewPolyline.setMap(null);
      pathPreviewPolyline = null;
    }
    hidePathContextMenu();
  }

  function hidePathContextMenu() {
    if (pathContextMenuOverlay) {
      pathContextMenuOverlay.setMap(null);
      pathContextMenuOverlay = null;
    }
  }

  function clearDraftMarker() {
    if (draftMarker) {
      draftMarker.setMap(null);
      draftMarker = null;
    }
  }

  function stopRelocateMode() {
    relocatePointId = null;
    if (map && mapMouseMoveHandler) {
      window.kakao.maps.event.removeListener(map, "mousemove", mapMouseMoveHandler);
      mapMouseMoveHandler = null;
    }
    clearDraftMarker();
    updatePointModeButtons();
  }

  function stopPathModes() {
    drawPathMode = false;
    editPathMode = false;
    pathExtendMode = false;
    selectedPathVertexIndex = null;
    workingPathCoordinates = [];
    clearPathEditorOverlay();
    startPathDrawButtonEl.classList.remove("is-active");
    startPathEditButtonEl.classList.remove("is-active");
    finishPathButtonEl.disabled = true;
    cancelPathButtonEl.disabled = true;
  }

  function ensureDraftMarker(lat, lng) {
    if (!mapReady) {
      return;
    }

    const position = new window.kakao.maps.LatLng(lat, lng);
    if (!draftMarker) {
      draftMarker = new window.kakao.maps.Marker({
        map,
        position,
        opacity: 0.45,
        zIndex: 20,
      });
    } else {
      draftMarker.setPosition(position);
      draftMarker.setMap(map);
    }
  }

  function getExtendedData(placemark) {
    return Array.from(placemark.getElementsByTagNameNS("*", "Data"))
      .map((node) => {
        const name = node.getAttribute("name") || "";
        const valueNode = node.getElementsByTagNameNS("*", "value")[0];
        const value = valueNode ? valueNode.textContent.trim() : "";
        return name || value ? { name: name || "value", value } : null;
      })
      .filter(Boolean);
  }

  function getExtendedDataValue(list, key) {
    const match = (Array.isArray(list) ? list : []).find((item) => String(item?.name || "").trim() === key);
    return match ? String(match.value || "").trim() : "";
  }

  function buildUploadedPoint(fileName, routeName, placemark, pointNode, index) {
    const coordinateNode = pointNode.getElementsByTagNameNS("*", "coordinates")[0];
    if (!coordinateNode) {
      return null;
    }

    const rawCoordinates = coordinateNode.textContent.trim();
    const [lng, lat, altitude] = rawCoordinates.split(",").map((value) => Number(value.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    const extendedData = getExtendedData(placemark);
    const createdOrderValue = Number(getExtendedDataValue(extendedData, "createdOrder"));
    const routeGroupValue = getExtendedDataValue(extendedData, "routeGroup");
    const routeOrderValue = Number(getExtendedDataValue(extendedData, "routeOrder"));

    return {
      id: `${fileName}-point-${index}`,
      source: "uploaded",
      routeName: normalizeRouteName(routeName || fileName),
      fileName,
      name: directChildText(placemark, "name") || fileName || "이름 없음",
      description: directChildText(placemark, "description"),
      address: directChildText(placemark, "address"),
      phoneNumber: directChildText(placemark, "phoneNumber"),
      styleUrl: directChildText(placemark, "styleUrl"),
      rawCoordinates,
      lat,
      lng,
      altitude: Number.isFinite(altitude) ? altitude : null,
      createdOrder: Number.isFinite(createdOrderValue) ? createdOrderValue : null,
      routeGroup: routeGroupValue === "merged" || routeGroupValue === "default" ? routeGroupValue : null,
      routeOrder: Number.isFinite(routeOrderValue) ? routeOrderValue : null,
      ridership: getRidershipFromExtendedData(extendedData),
      extendedData,
    };
  }

  function buildUploadedPath(fileName, routeName, placemark, lineStringNode, index) {
    const coordinateNode = lineStringNode.getElementsByTagNameNS("*", "coordinates")[0];
    if (!coordinateNode) {
      return null;
    }

    const rawCoordinates = coordinateNode.textContent.trim();
    const coordinates = rawCoordinates
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [lng, lat, altitude] = item.split(",").map((value) => Number(value.trim()));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          lat,
          lng,
          altitude: Number.isFinite(altitude) ? altitude : null,
        };
      })
      .filter(Boolean);

    if (coordinates.length < 2) {
      return null;
    }

    const extendedData = getExtendedData(placemark);
    const routeGroupValue = getExtendedDataValue(extendedData, "routeGroup");
    const routeOrderValue = Number(getExtendedDataValue(extendedData, "routeOrder"));

    return {
      id: `${fileName}-path-${index}`,
      source: "uploaded-path",
      routeName: normalizeRouteName(routeName || fileName),
      fileName,
      name: directChildText(placemark, "name") || normalizeRouteName(routeName || fileName),
      description: directChildText(placemark, "description"),
      styleUrl: directChildText(placemark, "styleUrl"),
      routeGroup: routeGroupValue === "merged" || routeGroupValue === "default" ? routeGroupValue : null,
      routeOrder: Number.isFinite(routeOrderValue) ? routeOrderValue : null,
      rawCoordinates,
      coordinates,
    };
  }

  function buildUploadedObservationArea(fileName, routeName, placemark, polygonNode, index) {
    const coordinatesNode = polygonNode.getElementsByTagNameNS("*", "coordinates")[0];
    if (!coordinatesNode) {
      return null;
    }

    const coordinates = coordinatesNode.textContent
      .trim()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [lng, lat] = item.split(",").map((value) => Number(value.trim()));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return { lat, lng };
      })
      .filter(Boolean);

    if (coordinates.length < 4) {
      return null;
    }

    const normalizedPoints = coordinates.filter((point, pointIndex, array) => (
      pointIndex < array.length - 1
        || point.lat !== array[0].lat
        || point.lng !== array[0].lng
    ));
    if (normalizedPoints.length < 3) {
      return null;
    }

    const extendedData = getExtendedData(placemark);
    const isObservationArea =
      getExtendedDataValue(extendedData, "observationArea") === "true"
      || normalizeRouteName(routeName) === normalizeRouteName("관찰 구역");
    if (!isObservationArea) {
      return null;
    }

    return normalizeObservationArea({
      id: `${fileName}-observation-area-${index}`,
      fileName,
      name: directChildText(placemark, "name") || `관찰 구역 ${index + 1}`,
      color: getExtendedDataValue(extendedData, "color") || "#2f8cff",
      hidden: getExtendedDataValue(extendedData, "hidden") === "true",
      points: normalizedPoints,
    });
  }

  function restoreRouteSettingsFromImportedKml(points, paths) {
    const routeMetaByName = new Map();
    [...(Array.isArray(points) ? points : []), ...(Array.isArray(paths) ? paths : [])].forEach((item) => {
      const routeName = normalizeRouteName(item?.routeName);
      if (!routeName) {
        return;
      }

      const current = routeMetaByName.get(routeName) || {};
      const next = { ...current };
      if ((item?.routeGroup === "merged" || item?.routeGroup === "default") && !next.routeGroup) {
        next.routeGroup = item.routeGroup;
      }
      if (Number.isFinite(Number(item?.routeOrder)) && !Number.isFinite(Number(next.routeOrder))) {
        next.routeOrder = Number(item.routeOrder);
      }
      routeMetaByName.set(routeName, next);
    });

    routeMetaByName.forEach((meta, routeName) => {
      routeSettings[routeName] = {
        ...getRouteSetting(routeName),
        ...(meta.routeGroup ? { routeGroup: meta.routeGroup } : {}),
        ...(Number.isFinite(Number(meta.routeOrder)) ? { routeOrder: Number(meta.routeOrder) } : {}),
      };
    });
  }

  function parseKml(text, filename) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.getElementsByTagName("parsererror")[0]) {
      throw new Error(`${filename}: KML ?뚯떛 ?ㅽ뙣`);
    }

    let pointIndex = 0;
    let pathIndex = 0;
    let observationAreaIndex = 0;
    const points = [];
    const paths = [];
    const areas = [];

    function walk(node, currentRouteName, depth) {
      const nodeName = node.localName;
      const directName = directChildText(node, "name");
      let nextRouteName = currentRouteName;

      if (nodeName === "Folder") {
        nextRouteName = directName || currentRouteName || filename;
      } else if (!currentRouteName && nodeName === "Document" && depth > 0 && directName) {
        nextRouteName = directName;
      }

      directChildrenByTag(node, "Placemark").forEach((placemark) => {
        const polygonNodes = Array.from(placemark.getElementsByTagNameNS("*", "Polygon"));
        polygonNodes.forEach((polygonNode) => {
          const area = buildUploadedObservationArea(
            filename,
            nextRouteName || filename,
            placemark,
            polygonNode,
            observationAreaIndex
          );
          observationAreaIndex += 1;
          if (area) {
            areas.push(area);
          }
        });

        const pointNodes = Array.from(placemark.getElementsByTagNameNS("*", "Point"));
        pointNodes.forEach((pointNode) => {
          const point = buildUploadedPoint(
            filename,
            nextRouteName || filename,
            placemark,
            pointNode,
            pointIndex
          );
          pointIndex += 1;
          if (point) {
            points.push(point);
          }
        });

        const lineStringNodes = Array.from(placemark.getElementsByTagNameNS("*", "LineString"));
        lineStringNodes.forEach((lineStringNode) => {
          const path = buildUploadedPath(
            filename,
            nextRouteName || filename,
            placemark,
            lineStringNode,
            pathIndex
          );
          pathIndex += 1;
          if (path) {
            paths.push(path);
          }
        });
      });

      [...directChildrenByTag(node, "Document"), ...directChildrenByTag(node, "Folder")].forEach((child) => {
        walk(child, nextRouteName, depth + 1);
      });
    }

    walk(xml.documentElement, "", 0);
    return { points, paths, areas };
  }

  function renderFileList(filesSummary) {
    fileListEl.innerHTML = "";
    filesSummary.forEach((item) => {
      const li = document.createElement("li");
      const nameBlock = document.createElement("div");
      nameBlock.className = "file-list-item-main";
      nameBlock.innerHTML = `<strong>${escapeHtml(item.name)}</strong><small>${item.pointCount}개 정류장 / ${item.pathCount}개 경로 / ${Number(item.areaCount) || 0}개 구역</small>`;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "file-list-remove";
      deleteButton.setAttribute("aria-label", `${item.name} 삭제`);
      deleteButton.title = `${item.name} 삭제`;
      deleteButton.textContent = "x";
      deleteButton.addEventListener("click", () => {
        removeUploadedFile(item.name);
      });

      li.appendChild(nameBlock);
      li.appendChild(deleteButton);
      fileListEl.appendChild(li);
    });
  }

  function removeUploadedFile(fileName) {
    const targetFileName = String(fileName || "").trim();
    if (!targetFileName) {
      return;
    }

    const summary = uploadedFileSummaries.find((item) => item.name === targetFileName);
    if (!summary) {
      return;
    }

    const confirmed = window.confirm(`"${targetFileName}" 파일을 불러온 목록에서 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();

    const removedPointIds = new Set(
      uploadedPoints
        .filter((point) => point.fileName === targetFileName)
        .map((point) => point.id)
    );
    const removedPathIds = new Set(
      uploadedPaths
        .filter((pathItem) => pathItem.fileName === targetFileName)
        .map((pathItem) => pathItem.id)
    );
    const removedRouteNames = new Set(
      uploadedPoints
        .filter((point) => point.fileName === targetFileName)
        .map((point) => normalizeRouteName(point.routeName))
        .concat(
          uploadedPaths
            .filter((pathItem) => pathItem.fileName === targetFileName)
            .map((pathItem) => normalizeRouteName(pathItem.routeName))
        )
        .filter(Boolean)
    );
    const removedAreaIds = new Set(
      observationAreas
        .filter((area) => area.fileName === targetFileName)
        .map((area) => area.id)
    );

    uploadedPoints = uploadedPoints.filter((point) => point.fileName !== targetFileName);
    uploadedPaths = uploadedPaths.filter((pathItem) => pathItem.fileName !== targetFileName);
    uploadedFileSummaries = uploadedFileSummaries.filter((item) => item.name !== targetFileName);
    observationAreas = observationAreas.filter((area) => area.fileName !== targetFileName);

    Object.keys(pointOverrides).forEach((pointId) => {
      if (removedPointIds.has(pointId)) {
        delete pointOverrides[pointId];
      }
    });
    Object.keys(pathOverrides).forEach((pathId) => {
      if (removedPathIds.has(pathId)) {
        delete pathOverrides[pathId];
      }
    });

    if (selectedPointId && removedPointIds.has(selectedPointId)) {
      selectedPointId = null;
    }
    if (selectedPathId && removedPathIds.has(selectedPathId)) {
      selectedPathId = null;
    }
    if (selectedObservationAreaId && removedAreaIds.has(selectedObservationAreaId)) {
      selectedObservationAreaId = null;
    }

    removedRouteNames.forEach((routeName) => {
      const routeStillExistsInUploads = uploadedPoints.some((point) => normalizeRouteName(point.routeName) === routeName)
        || uploadedPaths.some((pathItem) => normalizeRouteName(pathItem.routeName) === routeName);

      if (!routeStillExistsInUploads) {
        const removedCustomPointIds = new Set(
          customPoints
            .filter((point) => normalizeRouteName(point.routeName) === routeName)
            .map((point) => point.id)
        );
        const removedCustomPathIds = new Set(
          customPaths
            .filter((pathItem) => normalizeRouteName(pathItem.routeName) === routeName)
            .map((pathItem) => pathItem.id)
        );

        customPoints = customPoints.filter((point) => normalizeRouteName(point.routeName) !== routeName);
        customPaths = customPaths.filter((pathItem) => normalizeRouteName(pathItem.routeName) !== routeName);

        Object.keys(pointOverrides).forEach((pointId) => {
          if (removedCustomPointIds.has(pointId)) {
            delete pointOverrides[pointId];
          }
        });
        Object.keys(pathOverrides).forEach((pathId) => {
          if (removedCustomPathIds.has(pathId)) {
            delete pathOverrides[pathId];
          }
        });

        if (selectedPointId && removedCustomPointIds.has(selectedPointId)) {
          selectedPointId = null;
        }
        if (selectedPathId && removedCustomPathIds.has(selectedPathId)) {
          selectedPathId = null;
        }
      }

      const routeStillExists = getAllPoints().some((point) => point.routeName === routeName)
        || getAllPaths().some((pathItem) => pathItem.routeName === routeName);
      if (!routeStillExists) {
        delete routeSettings[routeName];
        highlightedRouteNames = highlightedRouteNames.filter((item) => item !== routeName);
        if (selectedRouteName === routeName) {
          selectedRouteName = null;
        }
      }
    });

    saveCustomPoints();
    saveCustomPaths();
    saveUploadedWorkspace();
    saveOverrides();
    savePathOverrides();
    saveRouteSettings();
    saveObservationAreas();
    fileCountEl.textContent = String(uploadedFileSummaries.length);
    renderFileList(uploadedFileSummaries);
    shouldFitMapToData = false;
    refreshUI();
    setStatus(`"${targetFileName}" 파일을 불러온 목록에서 제거했습니다.`, false);
  }

  function setRouteGroup(routeName, routeGroup) {
    pushUndoSnapshot();
    routeSettings[routeName] = {
      ...getRouteSetting(routeName),
      routeGroup,
    };
    saveRouteSettings();
    refreshUI();
  }

  function reorderRoutes(routeNames, sourceRouteName, targetRouteName) {
    const sourceIndex = routeNames.indexOf(sourceRouteName);
    const targetIndex = routeNames.indexOf(targetRouteName);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    pushUndoSnapshot();
    const reordered = [...routeNames];
    const [movedRouteName] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedRouteName);

    const baseOrder = Date.now();
    reordered.forEach((routeName, index) => {
      routeSettings[routeName] = {
        ...getRouteSetting(routeName),
        routeOrder: baseOrder + index,
      };
    });
    saveRouteSettings();
    draggedRouteName = null;
    refreshUI();
  }

  function selectRouteFromList(routeName) {
    stopPathModes();
    hasClearedSelection = false;
    selectedRouteName = routeName;
    addHighlightedRoute(routeName);
    selectedPointId = null;
    selectedPathId = null;
    ensureSelectedPoint();
    stopRelocateMode();
    refreshUI();
  }

  function renderRouteEntries(containerEl, routes, emptyMessage, moveTargetGroup) {
    containerEl.innerHTML = "";

    if (!routes.length) {
      containerEl.innerHTML = `<div class="details-card empty"><p class="details-empty">${emptyMessage}</p></div>`;
      return;
    }

    routes.forEach((routeName) => {
      const setting = getRouteSetting(routeName);
      const isMergedRoute = isMergedRouteName(routeName);
      const row = document.createElement("div");
      row.className = "route-row";
      if (isMergedRoute) {
        row.classList.add("is-merged-route");
      }

      const button = document.createElement("div");
      button.className = "route-button";
      button.tabIndex = 0;
      button.setAttribute("role", "button");
      if (isMergedRoute) {
        button.classList.add("is-merged-route");
      }
      button.style.borderLeft = `6px solid ${setting.color}`;
      if (routeName === selectedRouteName) {
        button.classList.add("is-selected");
      }

      const routePaths = getAllPaths().filter((path) => path.routeName === routeName);
      const pointCount = getAllPoints().filter((point) => point.routeName === routeName).length;
      const pathCount = routePaths.length;
      const totalRouteDistanceMeters = routePaths.reduce(
        (sum, pathItem) =>
          sum + (Number(pathItem.totalDistanceMeters || pathItem.estimatedDistanceMeters) || calculatePathDistanceMeters(pathItem)),
        0
      );
      const hasDesignedRoute = getAllPaths().some(
        (pathItem) => pathItem.routeName === routeName && pathItem.designedRoute === true
      );
      const titleRow = document.createElement("strong");
      titleRow.className = "route-title-row";
      const titleText = document.createElement("span");
      titleText.className = "route-title-text";
      if (editingRouteName === routeName) {
        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "route-title-input";
        renameInput.value = routeName;
        renameInput.addEventListener("click", (event) => {
          event.stopPropagation();
        });
        const commitRename = () => {
          try {
            const renamed = renameRoute(routeName, renameInput.value);
            editingRouteName = null;
            refreshUI();
            if (renamed !== routeName) {
              setStatus(`노선명을 "${renamed}" 로 변경했습니다.`, false);
            }
          } catch (error) {
            editingRouteName = null;
            refreshUI();
            setStatus(error.message, true);
          }
        };
        renameInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            renameInput.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            editingRouteName = null;
            refreshUI();
          }
        });
        renameInput.addEventListener("blur", commitRename, { once: true });
        titleText.appendChild(renameInput);
        window.setTimeout(() => {
          renameInput.focus();
          renameInput.select();
        }, 0);
      } else {
        titleText.textContent = routeName;
        titleText.title = "더블클릭해서 노선명 수정";
        titleText.addEventListener("dblclick", (event) => {
          event.stopPropagation();
          editingRouteName = routeName;
          renderRouteList();
        });
      }
      titleRow.appendChild(titleText);
      if (hasDesignedRoute) {
        const badge = document.createElement("span");
        badge.className = "route-badge";
        badge.textContent = "설계";
        titleRow.appendChild(badge);
      }
      const inlineMoveButton = document.createElement("button");
      inlineMoveButton.type = "button";
      inlineMoveButton.className = "route-inline-action";
      if (isMergedRoute) {
        inlineMoveButton.classList.add("is-merged-route");
      }
      inlineMoveButton.textContent = "이동";
      inlineMoveButton.title = moveTargetGroup === "merged" ? "병합 목록으로 이동" : "기존 목록으로 이동";
      inlineMoveButton.addEventListener("click", (event) => {
        event.stopPropagation();
        setRouteGroup(routeName, moveTargetGroup);
      });
      titleRow.appendChild(inlineMoveButton);

      const visibleLabel = document.createElement("label");
      visibleLabel.className = "route-toggle route-toggle-inline";
      visibleLabel.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      visibleLabel.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      const visibleInput = document.createElement("input");
      visibleInput.type = "checkbox";
      visibleInput.checked = setting.visible;
      visibleInput.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      visibleInput.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      visibleInput.addEventListener("change", (event) => {
        event.stopPropagation();
        pushUndoSnapshot();
        routeSettings[routeName] = {
          ...getRouteSetting(routeName),
          visible: event.target.checked,
        };
        saveRouteSettings();
        if (!event.target.checked && selectedRouteName === routeName) {
          selectedPointId = null;
        }
        refreshUI();
      });
      const visibleText = document.createElement("span");
      visibleText.textContent = "표시";
      visibleLabel.appendChild(visibleInput);
      visibleLabel.appendChild(visibleText);
      titleRow.appendChild(visibleLabel);

      const routeIconActions = document.createElement("span");
      routeIconActions.className = "route-icon-actions";

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "route-color-input";
      if (isMergedRoute) {
        colorInput.classList.add("is-merged-route");
      }
      colorInput.value = setting.color;
      colorInput.title = `${routeName} 색상`;
      colorInput.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      colorInput.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      colorInput.addEventListener("input", (event) => {
        routeSettings[routeName] = {
          ...getRouteSetting(routeName),
          color: event.target.value,
        };
        saveRouteSettings();
        refreshUI();
      });
      routeIconActions.appendChild(colorInput);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "route-delete-button";
      if (isMergedRoute) {
        deleteButton.classList.add("is-merged-route");
      }
      deleteButton.title = `${routeName} 삭제`;
      deleteButton.setAttribute("aria-label", `${routeName} 삭제`);
      deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12a2 2 0 0 1-2-2V8h12v11a2 2 0 0 1-2 2H8z" fill="currentColor"/></svg>';
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handleDeleteRoute(routeName);
      });
      routeIconActions.appendChild(deleteButton);
      titleRow.appendChild(routeIconActions);

      const metaText = document.createElement("span");
      metaText.textContent = `${pointCount}개 정류장 / ${pathCount}개 경로 / 총 ${formatDistanceKm(totalRouteDistanceMeters)}km`;
      button.appendChild(titleRow);
      button.appendChild(metaText);
      const handleRouteSelect = () => {
        selectRouteFromList(routeName);
      };
      button.addEventListener("click", handleRouteSelect);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleRouteSelect();
        }
      });
      const handleRouteRowDragOver = (event) => {
        event.preventDefault();
        if (draggedRouteName && draggedRouteName !== routeName) {
          row.classList.add("is-drop-target");
        }
      };
      const handleRouteRowDragLeave = () => {
        row.classList.remove("is-drop-target");
      };
      const handleRouteRowDrop = (event) => {
        event.preventDefault();
        row.classList.remove("is-drop-target");
        const sourceRouteName = draggedRouteName || event.dataTransfer?.getData("text/plain");
        if (!sourceRouteName || sourceRouteName === routeName) {
          return;
        }
        reorderRoutes(routes, sourceRouteName, routeName);
      };
      const clearRouteDragState = () => {
        draggedRouteName = null;
        containerEl.querySelectorAll(".route-row").forEach((item) => {
          item.classList.remove("is-dragging", "is-drop-target");
        });
      };
      row.addEventListener("dragover", handleRouteRowDragOver);
      row.addEventListener("dragleave", handleRouteRowDragLeave);
      row.addEventListener("drop", handleRouteRowDrop);
      button.addEventListener("dragover", handleRouteRowDragOver);
      button.addEventListener("dragleave", handleRouteRowDragLeave);
      button.addEventListener("drop", handleRouteRowDrop);
      button.addEventListener("dragend", clearRouteDragState);

      const dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = "route-drag-handle";
      dragHandle.draggable = true;
      dragHandle.title = "드래그해서 노선 순서 변경";
      dragHandle.setAttribute("aria-label", `${routeName} 순서 변경`);
      dragHandle.textContent = "≡";
      dragHandle.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      dragHandle.addEventListener("dragstart", (event) => {
        draggedRouteName = routeName;
        row.classList.add("is-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", routeName);
        }
      });
      dragHandle.addEventListener("dragend", clearRouteDragState);

      const controls = document.createElement("div");
      controls.className = "route-controls";
      controls.appendChild(dragHandle);
      row.addEventListener("click", (event) => {
        if (event.target.closest(".route-inline-action, .route-toggle, .route-color-input, .route-delete-button, .route-drag-handle, .route-title-input")) {
          return;
        }
        handleRouteSelect();
      });
      row.appendChild(button);
      row.appendChild(controls);
      containerEl.appendChild(row);
    });
  }

  function renderRouteList() {
    const routes = getRoutes();
    const originalQuery = normalizeSearchText(routeListSearchQueries.original);
    const mergedQuery = normalizeSearchText(routeListSearchQueries.merged);
    const originalGroupRoutes = routes.filter((routeName) => getRouteSetting(routeName).routeGroup !== "merged");
    const mergedGroupRoutes = routes.filter((routeName) => getRouteSetting(routeName).routeGroup === "merged");
    const originalRoutes = originalGroupRoutes
      .filter((routeName) => !originalQuery || normalizeSearchText(routeName).includes(originalQuery));
    const mergedRoutes = mergedGroupRoutes
      .filter((routeName) => !mergedQuery || normalizeSearchText(routeName).includes(mergedQuery));

    if (editingRouteName) {
      logRenameRouteDebug("render-route-list", {
        editingRouteName,
        originalRoutes,
        mergedRoutes,
        selectedRouteName,
      });
    }

    updateRouteGroupToggleButton(toggleOriginalRoutesButtonEl, originalGroupRoutes, "기존");
    updateRouteGroupToggleButton(toggleMergedRoutesButtonEl, mergedGroupRoutes, "개선");

    ensureRouteListTitleInput(routeListEl, "original", "불러온 노선");
    ensureRouteListSearchInput(routeListEl, "original");
    renderRouteEntries(routeListEl, originalRoutes, "노선이 없습니다.", "merged");

    if (mergedRouteListEl) {
      ensureRouteListTitleInput(mergedRouteListEl, "merged", "병합된 노선");
      ensureRouteListSearchInput(mergedRouteListEl, "merged");
      renderRouteEntries(mergedRouteListEl, mergedRoutes, "병합된 노선이 없습니다.", "default");
    }
  }

  function updateRouteGroupToggleButton(buttonEl, routeNames, groupLabel) {
    if (!buttonEl) {
      return;
    }
    const hasRoutes = routeNames.length > 0;
    const allVisible = hasRoutes && routeNames.every((routeName) => getRouteSetting(routeName).visible);
    buttonEl.disabled = !hasRoutes;
    buttonEl.textContent = allVisible ? "노선 숨김" : "노선 표시";
    buttonEl.dataset.nextVisible = allVisible ? "false" : "true";
    buttonEl.dataset.groupLabel = groupLabel;
  }

  function setAllRoutesVisible(visible) {
    const routes = getRoutes();
    if (!routes.length) {
      setStatus("표시를 변경할 노선이 없습니다.", true);
      return;
    }

    pushUndoSnapshot();
    routes.forEach((routeName) => {
      routeSettings[routeName] = {
        ...getRouteSetting(routeName),
        visible,
      };
    });

    saveRouteSettings();
    refreshUI();
    setStatus(visible ? "모든 노선을 표시합니다." : "모든 노선을 숨겼습니다.", false);
  }

  function setRouteGroupVisible(routeNames, visible, groupLabel) {
    if (!routeNames.length) {
      setStatus(`${groupLabel} 노선 목록이 없습니다.`, true);
      return;
    }

    pushUndoSnapshot();
    routeNames.forEach((routeName) => {
      routeSettings[routeName] = {
        ...getRouteSetting(routeName),
        visible,
      };
    });

    saveRouteSettings();
    refreshUI();
    setStatus(
      visible ? `${groupLabel} 노선 리스트를 표시 상태로 바꿉니다.` : `${groupLabel} 노선 리스트를 숨김 상태로 바꿉니다.`,
      false
    );
  }

  function updateVillageBusRouteSetting(partialVillageBusDesign) {
    if (!selectedRouteName) {
      return;
    }

    pushUndoSnapshot();
    const current = getRouteSetting(selectedRouteName);
    routeSettings[selectedRouteName] = {
      ...current,
      villageBusDesign: normalizeVillageBusDesignSettings({
        ...current.villageBusDesign,
        ...partialVillageBusDesign,
      }),
    };
    saveRouteSettings();
    renderVillageBusDesignPanel();
  }

  function getVillageBusDesignSummaryText(setting) {
    return `우선순위 ${setting.priority}, 차종 대형, 도로 이벤트 기본 반영으로 설계합니다.`;
  }

  function buildMergedPointName(pointA, pointB) {
    const nameA = String(pointA?.name || "").trim();
    const nameB = String(pointB?.name || "").trim();
    if (!nameA) {
      return nameB || "병합 정류장";
    }
    if (!nameB || nameA === nameB) {
      return nameA;
    }
    return `${nameA} · ${nameB}`;
  }

  function buildMergedExtendedData(sourcePoints) {
    const rows = [{ name: "병합 유형", value: "두 노선 병합 정류장" }];
    sourcePoints.forEach((point, index) => {
      rows.push({
        name: `원본 ${index + 1}`,
        value: `${point.routeName} / ${point.name}`,
      });
    });
    return rows;
  }

  function normalizeStopNameForMerge(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[()\-.,]/g, "")
      .replace(/정류장|정거장|버스정류소|버스정류장/g, "");
  }

  function stopNameSimilarity(pointA, pointB) {
    const nameA = normalizeStopNameForMerge(pointA?.name);
    const nameB = normalizeStopNameForMerge(pointB?.name);

    if (!nameA || !nameB) {
      return 0;
    }
    if (nameA === nameB) {
      return 1;
    }
    if (nameA.includes(nameB) || nameB.includes(nameA)) {
      return 0.8;
    }

    const tokensA = new Set(nameA.split(/[0-9]/).filter(Boolean));
    const tokensB = new Set(nameB.split(/[0-9]/).filter(Boolean));
    let overlap = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) {
        overlap += 1;
      }
    });
    return overlap > 0 ? overlap / Math.max(tokensA.size, tokensB.size, 1) : 0;
  }

  function buildStopMatchCandidates(pointsA, pointsB, maxDistanceMeters = 65) {
    const candidates = [];

    pointsA.forEach((pointA, indexA) => {
      pointsB.forEach((pointB, indexB) => {
        const distanceMeters = distanceInMeters(pointA, pointB);
        if (distanceMeters > maxDistanceMeters) {
          return;
        }

        const similarity = directionSimilarity(pointsA, indexA, pointsB, indexB);
        if (similarity < -0.2) {
          return;
        }

        const nameSimilarity = stopNameSimilarity(pointA, pointB);
        if (similarity < 0.15 && distanceMeters > 35 && nameSimilarity < 0.7) {
          return;
        }

        const distanceScore = Math.max(0, 1 - distanceMeters / maxDistanceMeters);
        const directionScore = Math.max(0, (similarity + 0.2) / 1.2);
        const score = distanceScore * 1.2 + directionScore * 1.35 + nameSimilarity * 0.8;

        if (score < 1.1) {
          return;
        }

        candidates.push({
          aIndex: indexA,
          bIndex: indexB,
          distanceMeters,
          similarity,
          nameSimilarity,
          score,
        });
      });
    });

    return candidates.sort((a, b) => a.aIndex - b.aIndex || a.bIndex - b.bIndex || b.score - a.score);
  }

  function findBestMonotonicMatchSequence(candidates) {
    if (!candidates.length) {
      return [];
    }

    const dp = candidates.map((candidate) => candidate.score);
    const prev = new Array(candidates.length).fill(-1);

    for (let index = 0; index < candidates.length; index += 1) {
      for (let previousIndex = 0; previousIndex < index; previousIndex += 1) {
        const previous = candidates[previousIndex];
        const current = candidates[index];
        if (previous.aIndex >= current.aIndex || previous.bIndex >= current.bIndex) {
          continue;
        }

        const deltaA = current.aIndex - previous.aIndex;
        const deltaB = current.bIndex - previous.bIndex;
        if (deltaA > 4 || deltaB > 4) {
          continue;
        }

        const continuityBonus = deltaA <= 2 && deltaB <= 2 ? 0.35 : 0.1;
        const nextScore = dp[previousIndex] + current.score + continuityBonus;
        if (nextScore > dp[index]) {
          dp[index] = nextScore;
          prev[index] = previousIndex;
        }
      }
    }

    let bestIndex = 0;
    for (let index = 1; index < dp.length; index += 1) {
      if (dp[index] > dp[bestIndex]) {
        bestIndex = index;
      }
    }

    const sequence = [];
    for (let index = bestIndex; index >= 0; index = prev[index]) {
      sequence.push(candidates[index]);
      if (prev[index] === -1) {
        break;
      }
    }
    return sequence.reverse();
  }

  function extractSharedCorridorGroups(sequence) {
    const groups = [];
    let currentGroup = [];

    sequence.forEach((match, index) => {
      const previous = sequence[index - 1];
      const isContinuous =
        previous &&
        match.aIndex > previous.aIndex &&
        match.bIndex > previous.bIndex &&
        match.aIndex - previous.aIndex <= 2 &&
        match.bIndex - previous.bIndex <= 2;

      if (!previous || isContinuous) {
        currentGroup.push(match);
      } else {
        groups.push(currentGroup);
        currentGroup = [match];
      }
    });

    if (currentGroup.length) {
      groups.push(currentGroup);
    }

    return groups.filter((group) => group.length >= 2);
  }

  function scoreCorridorGroup(group) {
    if (!group.length) {
      return 0;
    }

    const totalScore = group.reduce((sum, match) => sum + match.score, 0);
    return totalScore + group.length * 2;
  }

  function chooseBestCorridorGroup(groups) {
    if (!groups.length) {
      return [];
    }

    return groups.reduce((bestGroup, group) => (
      scoreCorridorGroup(group) > scoreCorridorGroup(bestGroup) ? group : bestGroup
    ), groups[0]);
  }

  function estimateTailCoverage(points) {
    if (!points.length) {
      return 0;
    }

    let coverage = points.length * 120;
    for (let index = 1; index < points.length; index += 1) {
      coverage += Math.min(500, distanceInMeters(points[index - 1], points[index]));
    }
    return coverage;
  }

  function buildSingleSourceEntries(points) {
    return points.map((point) => ({
      point,
      sourcePoints: [point],
    }));
  }

  function buildMergedCorridorEntries(backbonePoints, otherPoints, matches, useRouteAAsBackbone) {
    const matchByBackboneIndex = new Map(
      matches.map((match) => [useRouteAAsBackbone ? match.aIndex : match.bIndex, match])
    );
    const corridorStartIndex = useRouteAAsBackbone ? matches[0].aIndex : matches[0].bIndex;
    const corridorEndIndex = useRouteAAsBackbone ? matches[matches.length - 1].aIndex : matches[matches.length - 1].bIndex;
    const entries = [];

    for (let index = corridorStartIndex; index <= corridorEndIndex; index += 1) {
      const match = matchByBackboneIndex.get(index);
      if (match) {
        entries.push({
          point: backbonePoints[index],
          sourcePoints: useRouteAAsBackbone
            ? [backbonePoints[index], otherPoints[match.bIndex]]
            : [backbonePoints[index], otherPoints[match.aIndex]],
        });
      } else {
        entries.push({
          point: backbonePoints[index],
          sourcePoints: [backbonePoints[index]],
        });
      }
    }

    return entries;
  }

  function dedupeSequentialEntries(entries) {
    const deduped = [];

    entries.forEach((entry) => {
      const previous = deduped[deduped.length - 1];
      if (!previous) {
        deduped.push({
          point: entry.point,
          sourcePoints: [...entry.sourcePoints],
        });
        return;
      }

      const previousIds = previous.sourcePoints.map((point) => point.id).sort().join("|");
      const currentIds = entry.sourcePoints.map((point) => point.id).sort().join("|");
      if (previousIds === currentIds) {
        return;
      }

      deduped.push({
        point: entry.point,
        sourcePoints: [...entry.sourcePoints],
      });
    });

    return deduped;
  }

  function buildMergedPointEntries(routeNameA, routeNameB, pointsA, pointsB, matches) {
    if (!matches.length) {
      return [];
    }

    const useRouteAAsBackbone = pointsA.length >= pointsB.length;
    const backbonePoints = useRouteAAsBackbone ? pointsA : pointsB;
    const otherPoints = useRouteAAsBackbone ? pointsB : pointsA;
    const corridorStartBackbone = useRouteAAsBackbone ? matches[0].aIndex : matches[0].bIndex;
    const corridorEndBackbone = useRouteAAsBackbone ? matches[matches.length - 1].aIndex : matches[matches.length - 1].bIndex;
    const corridorStartOther = useRouteAAsBackbone ? matches[0].bIndex : matches[0].aIndex;
    const corridorEndOther = useRouteAAsBackbone ? matches[matches.length - 1].bIndex : matches[matches.length - 1].aIndex;

    const backbonePrefix = backbonePoints.slice(0, corridorStartBackbone);
    const backboneSuffix = backbonePoints.slice(corridorEndBackbone + 1);
    const otherPrefix = otherPoints.slice(0, corridorStartOther);
    const otherSuffix = otherPoints.slice(corridorEndOther + 1);

    const startTail = estimateTailCoverage(otherPrefix) > estimateTailCoverage(backbonePrefix) ? otherPrefix : backbonePrefix;
    const endTail = estimateTailCoverage(otherSuffix) > estimateTailCoverage(backboneSuffix) ? otherSuffix : backboneSuffix;
    const corridorEntries = buildMergedCorridorEntries(backbonePoints, otherPoints, matches, useRouteAAsBackbone);

    return dedupeSequentialEntries([
      ...buildSingleSourceEntries(startTail),
      ...corridorEntries,
      ...buildSingleSourceEntries(endTail),
    ]);
  }

  function compressMergedPointEntries(entries) {
    if (entries.length < 2) {
      return entries;
    }

    const compressed = [];

    entries.forEach((entry) => {
      const last = compressed[compressed.length - 1];
      if (!last) {
        compressed.push({
          point: entry.point,
          sourcePoints: [...entry.sourcePoints],
        });
        return;
      }

      const lastCenter = averagePoint(last.sourcePoints);
      const currentCenter = averagePoint(entry.sourcePoints);
      const shouldMerge =
        distanceInMeters(lastCenter, currentCenter) <= 85 &&
        (last.sourcePoints.length > 1 || entry.sourcePoints.length > 1 || stopNameSimilarity(last.point, entry.point) >= 0.6);

      if (shouldMerge) {
        const mergedSourcePoints = [...last.sourcePoints, ...entry.sourcePoints].filter(
          (point, index, array) => array.findIndex((item) => item.id === point.id) === index
        );
        last.sourcePoints = mergedSourcePoints;
        last.point = mergedSourcePoints[0];
        return;
      }

      compressed.push({
        point: entry.point,
        sourcePoints: [...entry.sourcePoints],
      });
    });

    return compressed;
  }

  function convertMergedEntriesToPoints(routeName, entries) {
    let createdOrderSeed = Date.now();
    return entries.map((entry) => {
      const representative = averagePoint(entry.sourcePoints);
      const primaryPoint = entry.sourcePoints[0] || entry.point;
      const pointName = entry.sourcePoints.length > 1
        ? entry.sourcePoints.slice(0, 2).reduce((name, point, index) => (
          index === 0 ? point.name : buildMergedPointName({ name }, point)
        ), "")
        : primaryPoint.name;

      const mergedPoint = {
        id: `custom-${createdOrderSeed}`,
        source: "custom",
        createdOrder: createdOrderSeed,
        routeName,
        fileName: "노선 병합",
        name: pointName || "병합 정류장",
        description: entry.sourcePoints.length > 1 ? "공통 구간 정류장을 통합한 병합 정류장" : `원본 노선 ${primaryPoint.routeName} 정류장`,
        address: primaryPoint.address || "",
        phoneNumber: primaryPoint.phoneNumber || "",
        styleUrl: primaryPoint.styleUrl || "",
        rawCoordinates: `${representative.lng},${representative.lat}`,
        lat: representative.lat,
        lng: representative.lng,
        altitude: null,
        extendedData: buildMergedExtendedData(entry.sourcePoints),
      };
      createdOrderSeed += 1;
      return mergedPoint;
    });
  }

  function buildSharedCorridorMatches(pointsA, pointsB) {
    const candidates = buildStopMatchCandidates(pointsA, pointsB);
    const sequence = findBestMonotonicMatchSequence(candidates);
    const groups = extractSharedCorridorGroups(sequence);
    return chooseBestCorridorGroup(groups);
  }

  function mergeOrderedRoutePoints(routeNameA, routeNameB, pointsA, pointsB, matches) {
    const entries = buildMergedPointEntries(routeNameA, routeNameB, pointsA, pointsB, matches);
    const compressedEntries = compressMergedPointEntries(entries);
    return convertMergedEntriesToPoints(`${routeNameA} + ${routeNameB} 병합`, compressedEntries);
  }

  function mergeSimpleRoutePoints(routeNameA, routeNameB, pointsA, pointsB) {
    const entries = [
      ...buildSingleSourceEntries(pointsA),
      ...buildSingleSourceEntries(pointsB),
    ];
    return convertMergedEntriesToPoints(`${routeNameA} + ${routeNameB} 병합`, entries);
  }

  function renderRouteMergePanel() {
    if (!routeMergePanelEl) {
      return;
    }

    const routes = getRoutes();
    ensureMergeRoutes();
    const canMerge = routes.length >= 2;
    routeMergePanelEl.classList.toggle("is-disabled", !canMerge);
    mergeRouteASelectEl.disabled = !canMerge;
    mergeRouteBSelectEl.disabled = !canMerge;
    mergeRoutesButtonEl.disabled = !canMerge || !mergeRouteAName || !mergeRouteBName || mergeRouteAName === mergeRouteBName;
    viewMergedRouteButtonEl.disabled = !latestMergedRouteName || !getRoutes().includes(latestMergedRouteName);

    mergeRouteASelectEl.innerHTML = "";
    mergeRouteBSelectEl.innerHTML = "";

    routes.forEach((routeName) => {
      const optionA = document.createElement("option");
      optionA.value = routeName;
      optionA.textContent = routeName;
      mergeRouteASelectEl.appendChild(optionA);

      const optionB = document.createElement("option");
      optionB.value = routeName;
      optionB.textContent = routeName;
      mergeRouteBSelectEl.appendChild(optionB);
    });

    if (mergeRouteAName) {
      mergeRouteASelectEl.value = mergeRouteAName;
    }
    if (mergeRouteBName) {
      mergeRouteBSelectEl.value = mergeRouteBName;
    }

    if (!canMerge) {
      routeMergeSummaryEl.textContent = "병합하려면 노선이 두 개 이상 필요합니다.";
      return;
    }

    if (simpleMergeCheckboxEl?.checked) {
      routeMergeSummaryEl.textContent = "단순병합은 두 노선의 정류장을 공통구간 판단 없이 순서대로 모두 합칩니다.";
      return;
    }

    routeMergeSummaryEl.textContent = latestMergedRouteName
      ? `최근 병합 결과는 "${latestMergedRouteName}" 이며, 선택 후 아래 노선 생성 메뉴를 바로 사용할 수 있습니다.`
      : "공통 주행 구간을 먼저 찾고, 연속된 중복 정류장만 대표 정류장으로 병합합니다.";
  }

  function handleMergeRoutes() {
    const routeNameA = normalizeRouteName(mergeRouteASelectEl.value);
    const routeNameB = normalizeRouteName(mergeRouteBSelectEl.value);

    if (!routeNameA || !routeNameB || routeNameA === routeNameB) {
      setStatus("병합할 서로 다른 두 노선을 선택하세요.", true);
      return;
    }

    const pointsA = getPointsInRoute(routeNameA);
    const pointsB = getPointsInRoute(routeNameB);

    if (pointsA.length < 2 || pointsB.length < 2) {
      setStatus("두 노선 모두 정류장이 2개 이상이어야 병합할 수 있습니다.", true);
      return;
    }

    const useSimpleMerge = simpleMergeCheckboxEl?.checked === true;
    const matches = useSimpleMerge ? [] : buildSharedCorridorMatches(pointsA, pointsB);
    const mergedRouteName = `${routeNameA} + ${routeNameB} 병합`;
    const mergedPoints = useSimpleMerge
      ? mergeSimpleRoutePoints(routeNameA, routeNameB, pointsA, pointsB)
      : mergeOrderedRoutePoints(routeNameA, routeNameB, pointsA, pointsB, matches);

    if (!useSimpleMerge && matches.length < 2) {
      setStatus("공통 주행 구간이 충분히 확인되지 않아 병합을 진행하지 않았습니다.", true);
      return;
    }

    pushUndoSnapshot();
    customPoints = customPoints.filter((point) => point.routeName !== mergedRouteName).concat(mergedPoints);
    customPaths = customPaths.filter((pathItem) => pathItem.routeName !== mergedRouteName);
    routeSettings[mergedRouteName] = {
      ...getRouteSetting(mergedRouteName),
      deleted: false,
      visible: true,
      routeGroup: "merged",
    };
    saveCustomPoints();
    saveCustomPaths();
    saveRouteSettings();

    selectedRouteName = mergedRouteName;
    latestMergedRouteName = mergedRouteName;
    selectedPointId = mergedPoints[0]?.id || null;
    selectedPathId = null;
    mergeRouteAName = routeNameA;
    mergeRouteBName = routeNameB;
    refreshUI();
    setStatus(
      useSimpleMerge
        ? `"${routeNameA}" 과 "${routeNameB}" 를 단순병합해 두 노선의 정류장 ${mergedPoints.length}개를 모두 합쳤습니다.`
        : `"${routeNameA}" 과 "${routeNameB}" 를 병합해 공통 구간 ${matches.length}개 정류장을 통합하고 전체 정류장을 ${mergedPoints.length}개로 단순화했습니다.`,
      false
    );
  }

  function handleViewMergedRoute() {
    if (!latestMergedRouteName || !getRoutes().includes(latestMergedRouteName)) {
      setStatus("먼저 병합 결과를 생성하세요.", true);
      return;
    }

    selectedRouteName = latestMergedRouteName;
    selectedPointId = getPointsInRoute(latestMergedRouteName)[0]?.id || null;
    selectedPathId = null;
    refreshUI();
    setStatus(`"${latestMergedRouteName}" 병합 결과를 불러왔습니다. 아래 노선 생성 메뉴를 사용할 수 있습니다.`, false);
  }

  function renderVillageBusDesignPanel() {
    if (!villageBusRouteCaptionEl) {
      return;
    }

    const controlElements = [
      designVillageBusRouteButtonEl,
      resetVillageBusRouteButtonEl,
      villagePrioritySelectEl,
    ];

    if (!selectedRouteName) {
      if (villageBusDesignPanelEl) {
        villageBusDesignPanelEl.classList.add("is-disabled");
      }
      controlElements.forEach((element) => {
        if (element) {
          element.disabled = true;
        }
      });
      villageBusRouteCaptionEl.textContent = "설계된 정류장을 기반으로 최적의 경로를 설계합니다.";
      villageBusDesignSummaryEl.textContent = "설계된 정류장을 기반으로 최적의 경로를 설계합니다.";
      return;
    }

    if (villageBusDesignPanelEl) {
      villageBusDesignPanelEl.classList.remove("is-disabled");
    }
    controlElements.forEach((element) => {
      if (element) {
        element.disabled = false;
      }
    });
    const setting = getRouteSetting(selectedRouteName).villageBusDesign;
    villageBusRouteCaptionEl.textContent = "설계된 정류장을 기반으로 최적의 경로를 설계합니다.";
    villagePrioritySelectEl.value = setting.priority;
    villageBusDesignSummaryEl.textContent = "설계된 정류장을 기반으로 최적의 경로를 설계합니다.";
  }

  function renderRoutePointList() {
    routePointListEl.innerHTML = "";
    ensurePointListSearchInput();
    const query = normalizeSearchText(pointListSearchQuery);
    const points = getPointsInSelectedRoute()
      .filter((point) => !query || normalizeSearchText(point.name).includes(query));

    if (!selectedRouteName) {
      routePointListEl.innerHTML = '<div class="details-card empty"><p class="details-empty">노선을 먼저 선택하세요.</p></div>';
      return;
    }

    if (!points.length) {
      routePointListEl.innerHTML = '<div class="details-card empty"><p class="details-empty">선택한 노선에는 정류장이 없습니다.</p></div>';
      return;
    }

    points.forEach((point, index) => {
      const setting = getRouteSetting(point.routeName);
      const row = document.createElement("div");
      row.className = "point-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "point-item";
      button.draggable = true;
      button.dataset.pointId = point.id;
      button.style.borderLeft = `6px solid ${setting.color}`;
      if (point.id === selectedPointId) {
        button.classList.add("is-selected");
      }
      const titleRow = document.createElement("strong");
      const titleText = document.createElement("span");
      titleText.className = "route-title-text";
      if (editingPointId === point.id) {
        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "route-title-input";
        renameInput.value = point.name;
        renameInput.addEventListener("click", (event) => {
          event.stopPropagation();
        });
        const commitRename = () => {
          try {
            const renamed = renamePoint(point.id, renameInput.value);
            editingPointId = null;
            refreshUI();
            if (renamed !== point.name) {
              setStatus(`정류장명을 "${renamed}" 로 변경했습니다.`, false);
            }
          } catch (error) {
            editingPointId = null;
            refreshUI();
            setStatus(error.message, true);
          }
        };
        renameInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            renameInput.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            editingPointId = null;
            refreshUI();
          }
        });
        renameInput.addEventListener("blur", commitRename, { once: true });
        titleText.appendChild(renameInput);
        window.setTimeout(() => {
          renameInput.focus();
          renameInput.select();
        }, 0);
      } else {
        titleText.textContent = `${index + 1}. ${point.name}`;
        titleText.title = "클릭해서 정류장명 수정";
        titleText.addEventListener("click", (event) => {
          event.stopPropagation();
          editingPointId = point.id;
          renderRoutePointList();
        });
      }
      titleRow.appendChild(titleText);
      button.appendChild(titleRow);
      const ridershipMeta = document.createElement("span");
      ridershipMeta.className = "point-meta";
      ridershipMeta.textContent =
        normalizeRidershipValue(point.ridership) == null
          ? "탑승객 미입력"
          : `탑승객 ${formatRidershipValue(point.ridership)}명`;
      button.appendChild(ridershipMeta);
      button.addEventListener("click", () => selectPointById(point.id));
      button.addEventListener("dragstart", (event) => {
        draggedRoutePointId = point.id;
        button.classList.add("is-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", point.id);
        }
      });
      button.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (draggedRoutePointId && draggedRoutePointId !== point.id) {
          button.classList.add("is-drop-target");
        }
      });
      button.addEventListener("dragleave", () => {
        button.classList.remove("is-drop-target");
      });
      button.addEventListener("dragend", () => {
        draggedRoutePointId = null;
        routePointListEl.querySelectorAll(".point-item").forEach((item) => {
          item.classList.remove("is-dragging", "is-drop-target");
        });
      });
      button.addEventListener("drop", (event) => {
        event.preventDefault();
        button.classList.remove("is-drop-target");
        const sourcePointId = draggedRoutePointId || event.dataTransfer?.getData("text/plain");
        if (!sourcePointId || sourcePointId === point.id) {
          return;
        }
        reorderPointsInRoute(selectedRouteName, sourcePointId, point.id);
      });

      const controls = document.createElement("div");
      controls.className = "point-controls";

      const orderInput = document.createElement("input");
      orderInput.type = "number";
      orderInput.min = "1";
      orderInput.max = String(points.length);
      orderInput.value = String(index + 1);
      orderInput.className = "point-order-input";
      orderInput.title = "이동할 순서를 입력하세요";
      orderInput.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      orderInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          orderInput.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          orderInput.value = String(index + 1);
          orderInput.blur();
        }
      });
      orderInput.addEventListener("blur", () => {
        const normalizedValue = String(
          Math.min(points.length, Math.max(1, Math.floor(Number(orderInput.value) || index + 1)))
        );
        orderInput.value = normalizedValue;
        movePointToRouteOrder(selectedRouteName, point.id, normalizedValue);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "point-delete-button";
      deleteButton.textContent = "삭제";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedPointId = point.id;
        handleDeletePoint();
      });

      controls.appendChild(orderInput);
      controls.appendChild(deleteButton);
      row.appendChild(button);
      row.appendChild(controls);
      routePointListEl.appendChild(row);
    });
  }

  function reorderPointsInRoute(routeName, sourcePointId, targetPointId) {
    const points = getPointsInRoute(routeName);
    const sourceIndex = points.findIndex((point) => point.id === sourcePointId);
    const targetIndex = points.findIndex((point) => point.id === targetPointId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    pushUndoSnapshot();
    const reordered = [...points];
    const [movedPoint] = reordered.splice(sourceIndex, 1);
    const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertIndex, 0, movedPoint);

    const createdOrderBase = Date.now();
    reordered.forEach((point, index) => {
      const createdOrder = createdOrderBase + index;
      if (point.source === "custom") {
        const customIndex = customPoints.findIndex((item) => item.id === point.id);
        if (customIndex >= 0) {
          customPoints[customIndex] = {
            ...customPoints[customIndex],
            createdOrder,
          };
        }
      } else {
        pointOverrides[point.id] = {
          ...(pointOverrides[point.id] || {}),
          createdOrder,
        };
      }
    });

    saveCustomPoints();
    saveOverrides();
    selectedPointId = movedPoint.id;
    draggedRoutePointId = null;
    refreshUI();
    setStatus(`"${routeName}" 노선의 정류장 순서를 변경했습니다.`, false);
  }

  function movePointToRouteOrder(routeName, pointId, nextOrder) {
    const points = getPointsInRoute(routeName);
    const sourceIndex = points.findIndex((point) => point.id === pointId);
    const parsedOrder = Number(nextOrder);

    if (sourceIndex < 0 || !Number.isFinite(parsedOrder)) {
      return;
    }

    const targetIndex = Math.min(points.length - 1, Math.max(0, Math.floor(parsedOrder) - 1));
    if (sourceIndex === targetIndex) {
      return;
    }

    const targetPoint = points[targetIndex];
    if (!targetPoint) {
      return;
    }

    reorderPointsInRoute(routeName, pointId, targetPoint.id);
  }

  function scrollSelectedPointRowIntoView() {
    if (!selectedPointId || !routePointListEl) {
      return;
    }

    const selectedRow = routePointListEl.querySelector(`.point-item[data-point-id="${selectedPointId}"]`);
    if (!selectedRow) {
      return;
    }

    selectedRow.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }

  function restoreWorkspaceFromStorage() {
    if (!uploadedPoints.length && !uploadedPaths.length && !customPoints.length && !customPaths.length && !observationAreas.length) {
      return;
    }

    fileCountEl.textContent = String(uploadedFileSummaries.length);
    renderFileList(uploadedFileSummaries);
    selectedRouteName = typeof savedUiState.selectedRouteName === "string" ? savedUiState.selectedRouteName : null;
    selectedPointId = typeof savedUiState.selectedPointId === "string" ? savedUiState.selectedPointId : null;
    selectedPathId = typeof savedUiState.selectedPathId === "string" ? savedUiState.selectedPathId : null;
    hasClearedSelection = !selectedRouteName && !selectedPointId && !selectedPathId;
    shouldFitMapToData = false;
  }

  function renderMoveRouteOptions() {
    const routes = getRoutes();
    moveRouteSelectEl.innerHTML = "";

    if (!selectedPointId || routes.length < 2) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = routes.length < 2 ? "이동 가능한 노선 없음" : "정류장을 선택하세요";
      moveRouteSelectEl.appendChild(option);
      moveRouteSelectEl.disabled = true;
      movePointButtonEl.disabled = true;
      return;
    }

    const currentPoint = getPointById(selectedPointId);
    const targetRoutes = routes.filter((routeName) => routeName !== currentPoint?.routeName);

    if (!targetRoutes.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "이동 가능한 노선 없음";
      moveRouteSelectEl.appendChild(option);
      moveRouteSelectEl.disabled = true;
      movePointButtonEl.disabled = true;
      return;
    }

    targetRoutes.forEach((routeName) => {
      const option = document.createElement("option");
      option.value = routeName;
      option.textContent = routeName;
      moveRouteSelectEl.appendChild(option);
    });

    moveRouteSelectEl.disabled = false;
    movePointButtonEl.disabled = false;
  }

  function renderFormRouteOptions(selectedValue) {
    const routes = getRoutes();
    formRouteSelectEl.innerHTML = "";

    routes.forEach((routeName) => {
      const option = document.createElement("option");
      option.value = routeName;
      option.textContent = routeName;
      formRouteSelectEl.appendChild(option);
    });

    const newOption = document.createElement("option");
    newOption.value = NEW_ROUTE_VALUE;
    newOption.textContent = "새 노선 추가";
    formRouteSelectEl.appendChild(newOption);

    if (selectedValue && routes.includes(selectedValue)) {
      formRouteSelectEl.value = selectedValue;
      newRouteFieldEl.classList.remove("is-visible");
      newRouteNameEl.value = "";
      return;
    }

    if (selectedValue && !routes.includes(selectedValue)) {
      formRouteSelectEl.value = NEW_ROUTE_VALUE;
      newRouteFieldEl.classList.add("is-visible");
      newRouteNameEl.value = selectedValue;
      return;
    }

    if (selectedRouteName && routes.includes(selectedRouteName)) {
      formRouteSelectEl.value = selectedRouteName;
      newRouteFieldEl.classList.remove("is-visible");
      newRouteNameEl.value = "";
      return;
    }

    if (routes.length) {
      formRouteSelectEl.value = routes[0];
      newRouteFieldEl.classList.remove("is-visible");
      newRouteNameEl.value = "";
      return;
    }

    formRouteSelectEl.value = NEW_ROUTE_VALUE;
    newRouteFieldEl.classList.add("is-visible");
    newRouteNameEl.value = "";
  }

  function getSelectedFormRouteName() {
    if (formRouteSelectEl.value === NEW_ROUTE_VALUE) {
      return normalizeRouteName(newRouteNameEl.value);
    }

    return normalizeRouteName(formRouteSelectEl.value);
  }

  function renderPathRouteOptions(selectedValue) {
    const routes = getRoutes();
    pathRouteSelectEl.innerHTML = "";

    routes.forEach((routeName) => {
      const option = document.createElement("option");
      option.value = routeName;
      option.textContent = routeName;
      pathRouteSelectEl.appendChild(option);
    });

    const newOption = document.createElement("option");
    newOption.value = NEW_ROUTE_VALUE;
    newOption.textContent = "새 노선 추가";
    pathRouteSelectEl.appendChild(newOption);

    if (selectedValue && routes.includes(selectedValue)) {
      pathRouteSelectEl.value = selectedValue;
      pathNewRouteFieldEl.classList.remove("is-visible");
      pathNewRouteNameEl.value = "";
      return;
    }

    if (selectedValue && !routes.includes(selectedValue)) {
      pathRouteSelectEl.value = NEW_ROUTE_VALUE;
      pathNewRouteFieldEl.classList.add("is-visible");
      pathNewRouteNameEl.value = selectedValue;
      return;
    }

    if (selectedRouteName && routes.includes(selectedRouteName)) {
      pathRouteSelectEl.value = selectedRouteName;
      pathNewRouteFieldEl.classList.remove("is-visible");
      pathNewRouteNameEl.value = "";
      return;
    }

    if (routes.length) {
      pathRouteSelectEl.value = routes[0];
      pathNewRouteFieldEl.classList.remove("is-visible");
      pathNewRouteNameEl.value = "";
      return;
    }

    pathRouteSelectEl.value = NEW_ROUTE_VALUE;
    pathNewRouteFieldEl.classList.add("is-visible");
    pathNewRouteNameEl.value = "";
  }

  function getSelectedPathRouteName() {
    if (pathRouteSelectEl.value === NEW_ROUTE_VALUE) {
      return normalizeRouteName(pathNewRouteNameEl.value);
    }

    return normalizeRouteName(pathRouteSelectEl.value);
  }

  function createMidpointCoordinate(start, end) {
    return {
      lat: Number(((start.lat + end.lat) / 2).toFixed(7)),
      lng: Number(((start.lng + end.lng) / 2).toFixed(7)),
      altitude:
        start.altitude == null || end.altitude == null
          ? null
          : Number((((start.altitude || 0) + (end.altitude || 0)) / 2).toFixed(2)),
    };
  }

  function expandMovedVertexWithMidpoints(coordinates, movedIndex) {
    const nextCoordinates = coordinates.map((coordinate) => ({ ...coordinate }));
    const movedCoordinate = nextCoordinates[movedIndex];

    if (!movedCoordinate) {
      return nextCoordinates;
    }

    if (movedIndex > 0) {
      const previousCoordinate = nextCoordinates[movedIndex - 1];
      nextCoordinates.splice(movedIndex, 0, createMidpointCoordinate(previousCoordinate, movedCoordinate));
    }

    const currentIndex = movedIndex > 0 ? movedIndex + 1 : movedIndex;
    if (currentIndex < nextCoordinates.length - 1) {
      const nextCoordinate = nextCoordinates[currentIndex + 1];
      nextCoordinates.splice(
        currentIndex + 1,
        0,
        createMidpointCoordinate(nextCoordinates[currentIndex], nextCoordinate)
      );
    }

    return nextCoordinates;
  }

  function createMarkerImage(color, isSelected, labelText = "", isMuted = false) {
    const size = isSelected ? 30 : 26;
    const stroke = isSelected ? "#1f1a14" : isMuted ? "#d8e2ee" : "#ffffff";
    const strokeWidth = isSelected ? 3 : 2;
    const radius = isSelected ? 11 : 10;
    const center = size / 2;
    const displayLabel = String(labelText || "").slice(0, 3);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" fill-opacity="${isMuted ? "0.76" : "1"}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <text
          x="${center}"
          y="${center + 1}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Segoe UI, Noto Sans KR, sans-serif"
          font-size="${displayLabel.length >= 3 ? 9 : 11}"
          font-weight="700"
          fill="#ffffff"
        >${escapeHtml(displayLabel)}</text>
      </svg>
    `.trim();

    return new window.kakao.maps.MarkerImage(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      new window.kakao.maps.Size(size, size),
      { offset: new window.kakao.maps.Point(center, center) }
    );
  }

  function createVertexMarkerImage(color, kind, isSelected) {
    const size = isSelected ? 20 : 16;
    const center = size / 2;
    const fill = kind === "start" ? "#16a34a" : kind === "end" ? "#dc2626" : color;
    const stroke = isSelected ? "#111827" : "#ffffff";
    const strokeWidth = isSelected ? 3 : 2;
    const shape =
      kind === "middle"
        ? `<rect x="${isSelected ? 3 : 2}" y="${isSelected ? 3 : 2}" width="${isSelected ? 14 : 12}" height="${isSelected ? 14 : 12}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
        : `<circle cx="${center}" cy="${center}" r="${isSelected ? 7 : 6}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${shape}
      </svg>
    `.trim();

    return new window.kakao.maps.MarkerImage(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      new window.kakao.maps.Size(size, size),
      { offset: new window.kakao.maps.Point(center, center) }
    );
  }

  function showPathContextMenu(position, actions) {
    hidePathContextMenu();

    const wrapper = document.createElement("div");
    wrapper.className = "path-context-menu";
    const stopMenuEvent = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.kakao && window.kakao.maps && window.kakao.maps.event) {
        window.kakao.maps.event.preventMap();
      }
    };

    ["mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach((eventName) => {
      wrapper.addEventListener(eventName, stopMenuEvent);
    });

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `path-context-button${action.danger ? " danger" : ""}`;
      button.textContent = action.label;
      button.addEventListener("click", (event) => {
        stopMenuEvent(event);
        hidePathContextMenu();
        action.onClick();
      });
      wrapper.appendChild(button);
    });

    pathContextMenuOverlay = new window.kakao.maps.CustomOverlay({
      map,
      position,
      content: wrapper,
      xAnchor: 0.1,
      yAnchor: 1.2,
      zIndex: 100,
    });
  }

  function syncPathPreview() {
    clearPathEditorOverlay();
    if (!mapReady || workingPathCoordinates.length === 0) {
      return;
    }

    const routeName = selectedRouteName || getSelectedPathRouteName();
    const routeSetting = getRouteSetting(routeName);
    const linePath = workingPathCoordinates.map(
      (coordinate) => new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng)
    );

    pathPreviewPolyline = new window.kakao.maps.Polyline({
      map,
      path: linePath,
      strokeWeight: 6,
      strokeColor: routeSetting.color,
      strokeOpacity: 0.95,
      strokeStyle: "solid",
      endArrow: true,
    });
    if (drawPathMode) {
      workingPathCoordinates.forEach((coordinate, index) => {
        const isFirst = index === 0;
        const isLast = index === workingPathCoordinates.length - 1;
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng),
          draggable: false,
          image: createVertexMarkerImage(
            routeSetting.color,
            isFirst ? "start" : isLast ? "end" : "middle",
            false
          ),
          zIndex: 30,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          if (isLast && workingPathCoordinates.length >= 2) {
            handlePathFormSubmit();
            return;
          }

          setStatus("마지막 점을 다시 클릭하면 경로를 저장하고 경로 추가 모드를 종료합니다.", false);
        });

        window.kakao.maps.event.addListener(marker, "rightclick", () => {
          showPathContextMenu(marker.getPosition(), [
            {
              label: "점 삭제",
              danger: true,
              onClick: () => {
                deleteWorkingPathVertex(index);
              },
            },
            {
              label: "경로 삭제",
              danger: true,
              onClick: () => {
                discardWorkingPath();
              },
            },
          ]);
        });

        pathVertexMarkers.push(marker);
      });
      return;
    }

    if (!editPathMode) {
      return;
    }

    workingPathCoordinates.forEach((coordinate, index) => {
      const isFirst = index === 0;
      const isLast = index === workingPathCoordinates.length - 1;
      const isSelectedVertex = index === selectedPathVertexIndex;
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng),
        draggable: true,
        image: createVertexMarkerImage(
          routeSetting.color,
          isFirst ? "start" : isLast ? "end" : "middle",
          isSelectedVertex
        ),
        zIndex: 30,
      });

      const updateDraggedVertex = (mouseEvent) => {
        workingPathCoordinates[index] = {
          ...workingPathCoordinates[index],
          lat: Number(mouseEvent.latLng.getLat().toFixed(7)),
          lng: Number(mouseEvent.latLng.getLng().toFixed(7)),
        };
        syncPathPreview();
      };

      window.kakao.maps.event.addListener(marker, "drag", updateDraggedVertex);
      window.kakao.maps.event.addListener(marker, "dragend", updateDraggedVertex);

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (isLast) {
          if (pathExtendMode) {
            persistWorkingPath({
              closeModes: true,
              successMessage: () => "경로 수정 내용을 저장하고 편집을 종료했습니다.",
            });
            return;
          }
          pathExtendMode = !pathExtendMode;
          selectedPathVertexIndex = null;
          syncPathPreview();
          updatePathEditorUi();
          setStatus(
            pathExtendMode
              ? "경로 연장 모드를 시작했습니다. 지도 클릭으로 점을 계속 추가하고, 빨간 끝점을 다시 클릭하면 연장 모드를 종료합니다."
              : "경로 연장 모드를 종료했습니다.",
            false
          );
          return;
        }

        selectedPathVertexIndex = index;
        pathExtendMode = false;
        syncPathPreview();
        updatePathEditorUi();
        setStatus("점을 선택했습니다. 지도에서 새 위치를 클릭하면 점이 이동합니다.", false);
      });

      window.kakao.maps.event.addListener(marker, "rightclick", () => {
        showPathContextMenu(marker.getPosition(), [
          {
            label: "점 삭제",
            danger: true,
            onClick: () => {
              deleteWorkingPathVertex(index);
            },
          },
          {
            label: "경로 삭제",
            danger: true,
            onClick: () => {
              handleDeletePath();
            },
          },
        ]);
      });

      pathVertexMarkers.push(marker);
    });
  }

  function deleteWorkingPathVertex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= workingPathCoordinates.length) {
      return;
    }
    if (workingPathCoordinates.length <= 2) {
      setStatus("경로에는 최소 2개 좌표가 필요합니다.", true);
      return;
    }

    const indexesToDelete = new Set([index]);
    if (index === 0) {
      if (index + 1 < workingPathCoordinates.length) {
        indexesToDelete.add(index + 1);
      }
      if (index + 2 < workingPathCoordinates.length) {
        indexesToDelete.add(index + 2);
      }
    } else if (index === workingPathCoordinates.length - 1) {
      indexesToDelete.add(index - 1);
      if (index - 2 >= 0) {
        indexesToDelete.add(index - 2);
      }
    } else {
      indexesToDelete.add(index - 1);
      indexesToDelete.add(index + 1);
    }
    const nextCoordinates = workingPathCoordinates.filter((_, coordinateIndex) => !indexesToDelete.has(coordinateIndex));
    if (nextCoordinates.length < 2) {
      setStatus("선택한 점과 양옆 선분을 함께 삭제하면 경로 좌표가 2개 미만이 됩니다.", true);
      return;
    }

    pushUndoSnapshot();
    workingPathCoordinates = nextCoordinates;
    selectedPathVertexIndex = null;
    pathExtendMode = false;
    syncPathPreview();
    updatePathEditorUi();
    setStatus("선택한 점과 양옆에 연결된 경로 선분을 삭제했습니다.", false);
  }

  function discardWorkingPath() {
    const confirmed = window.confirm("현재 경로를 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    if (selectedPathId && getPathById(selectedPathId)) {
      handleDeletePath();
      return;
    }

    pushUndoSnapshot();
    stopPathModes();
    refreshUI();
    setStatus("작성 중인 경로를 삭제했습니다.", false);
  }

  function updatePathEditorUi() {
    const hasSelectedPath = Boolean(getPathById(selectedPathId));
    const selectedPath = getPathById(selectedPathId);
    const canSaveDesignedPath = Boolean(selectedPath && selectedPath.designedRoute === true);
    const drawing = drawPathMode;
    const editing = editPathMode;
    const pathEditingActive = drawing || editing;

    startPathDrawButtonEl.classList.toggle("is-active", drawing);
    startPathEditButtonEl.classList.toggle("is-active", editing);
    finishPathButtonEl.disabled = !(
      canSaveDesignedPath || ((drawing || editing) && workingPathCoordinates.length >= 2)
    );
    if (saveDesignedPathButtonEl) {
      saveDesignedPathButtonEl.disabled = !canSaveDesignedPath;
    }
    cancelPathButtonEl.disabled = !(drawing || editing);
    deletePathButtonEl.disabled = !hasSelectedPath;
    addPointButtonEl.disabled = pathEditingActive;
    resetPointButtonEl.disabled = pathEditingActive;
    movePointButtonEl.disabled = pathEditingActive || movePointButtonEl.disabled;
    deletePointButtonEl.disabled = pathEditingActive || !getPointById(selectedPointId);

    Array.from(pointFormEl.elements).forEach((element) => {
      if (element === deletePointButtonEl || element === resetPointButtonEl) {
        element.disabled = pathEditingActive || element.disabled;
        return;
      }

      if (element === movePointButtonEl) {
        return;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) {
        if (element.id !== "delete-point-button" && element.id !== "reset-point-button" && element.id !== "move-point-button") {
          element.disabled = pathEditingActive;
        }
      }
    });

    if (drawing) {
      pathEditorHelpEl.textContent = "지도를 클릭해 경로 점을 추가합니다. 마지막 점을 다시 클릭하면 현재 경로가 저장되고 추가 모드가 종료됩니다.";
    } else if (editing) {
      pathEditorHelpEl.textContent = pathExtendMode
        ? "경로 연장 중입니다. 지도 클릭으로 점을 계속 추가하고, 빨간 끝점을 다시 클릭하면 연장 모드를 종료합니다."
        : "중간 점은 드래그로 이동합니다. 시작점은 초록, 끝점은 빨강입니다. 빨간 끝점을 클릭하면 연장 모드로 전환됩니다.";
    } else if (canSaveDesignedPath) {
      pathEditorHelpEl.textContent = "설계 노선이 선택되어 있습니다. 경로 저장을 누르면 현재 설계 라인을 그대로 일반 경로로 저장합니다.";
    } else {
      pathEditorHelpEl.textContent = "노선을 선택한 뒤 새 경로를 그리거나 기존 경로의 점을 드래그해 수정합니다.";
    }
  }

  function saveDesignedPathAsRegularPath() {
    const selectedPath = getPathById(selectedPathId);
    if (!selectedPath || selectedPath.designedRoute !== true) {
      throw new Error("저장할 설계 노선을 먼저 선택하세요.");
    }

    pushUndoSnapshot();

    const updatedPath = {
      ...selectedPath,
      routeName: getSelectedPathRouteName(),
      name: pathFormEls.name.value.trim() || selectedPath.name || "이름 없는 경로",
      description: pathFormEls.description.value.trim(),
      designedRoute: false,
    };

    if (selectedPath.source === "custom-path") {
      const index = customPaths.findIndex((pathItem) => pathItem.id === selectedPath.id);
      if (index >= 0) {
        customPaths[index] = updatedPath;
        saveCustomPaths();
      }
    } else {
      pathOverrides[selectedPath.id] = {
        ...(pathOverrides[selectedPath.id] || {}),
        routeName: updatedPath.routeName,
        name: updatedPath.name,
        description: updatedPath.description,
        coordinates: updatedPath.coordinates,
        rawCoordinates: updatedPath.rawCoordinates,
        designedRoute: false,
      };
      savePathOverrides();
    }

    selectedRouteName = updatedPath.routeName;
    selectedPathId = updatedPath.id;
    fillPathForm(updatedPath);
    refreshUI();
    setStatus(`설계 노선 "${updatedPath.name}" 을 현재 라인 그대로 일반 경로로 저장했습니다.`, false);
    return updatedPath;
  }

  function startPathDrawMode() {
    if (!selectedRouteName) {
      setStatus("경로를 그리기 전에 노선을 먼저 선택하세요.", true);
      return;
    }

    const selectedPath = getPathById(selectedPathId);
    if (selectedPath && selectedPath.designedRoute === true) {
      stopRelocateMode();
      convertDesignedPathToEditablePath(selectedPath);
      return;
    }

    stopObservationAreaDrawMode();
    stopRelocateMode();
    selectedPointId = null;
    selectedPathId = null;
    drawPathMode = true;
    editPathMode = false;
    pathExtendMode = false;
    workingPathCoordinates = [];
    fillPathForm(null);
    updatePathEditorUi();
    syncPathPreview();
    setStatus(`새 경로 그리기 모드입니다. 현재 노선은 ${selectedRouteName}입니다. 지도에서 점을 클릭하세요.`, false);
  }

  function startPathEditMode() {
    const selectedPath = getPathById(selectedPathId)
      || (selectedRouteName
        ? getAllPaths().find((pathItem) => pathItem.routeName === selectedRouteName)
        : null);
    if (!selectedPath) {
      setStatus("편집할 경로를 먼저 선택하세요.", true);
      return;
    }

    stopObservationAreaDrawMode();
    stopRelocateMode();
    selectedPointId = null;
    drawPathMode = false;
    editPathMode = true;
    pathExtendMode = false;
    selectedPathVertexIndex = null;
    selectedPathId = selectedPath.id;
    selectedRouteName = selectedPath.routeName;
    workingPathCoordinates = selectedPath.coordinates.map((coordinate) => ({ ...coordinate }));
    fillPathForm(selectedPath);
    renderPoints();
    updatePathEditorUi();
    syncPathPreview();
    setStatus("경로 편집 모드입니다. 점을 드래그해 수정하세요.", false);
  }

  function renderPointDetails(point) {
    if (!point) {
      setEmptyDetails();
      return;
    }

    const populationEstimate = estimatePointPopulation(point, 100);
    openPointDetailsSection();
    pointDetailsEl.classList.remove("empty");
    const rows = [
      { label: "노선", value: point.routeName },
      { label: "구분", value: point.source === "custom" ? "직접 추가" : "KML 불러오기" },
      { label: "이름", value: point.name },
      { label: "파일", value: point.fileName },
      { label: "위도", value: String(point.lat) },
      { label: "경도", value: String(point.lng) },
      { label: "고도", value: point.altitude == null ? "" : String(point.altitude) },
      { label: "원본 좌표", value: point.rawCoordinates },
      { label: "설명", value: point.description },
      { label: "주소", value: point.address },
      { label: "전화번호", value: point.phoneNumber },
      { label: "스타일", value: point.styleUrl },
      { label: "탑승객 수", value: normalizeRidershipValue(point.ridership) == null ? "" : `${formatRidershipValue(point.ridership)}명` },
      { label: "100m 예상 가구수", value: `${populationEstimate.estimatedHouseholds}가구` },
      { label: "100m 예상 인구수", value: `${populationEstimate.estimatedPopulation}명` },
      { label: "추정 근거", value: populationEstimate.basisText },
    ].filter((row) => row.value);

    const originalUploadedPoint = point.source === "uploaded" ? getUploadedPointSource(point.id) : null;
    const originalPointName = String(originalUploadedPoint?.name || "").trim();
    const isRenamedUploadedPoint = Boolean(originalPointName) && originalPointName !== String(point.name || "").trim();
    const extendedRows = (point.extendedData || [])
      .filter((item) => {
        if (!isRenamedUploadedPoint) {
          return true;
        }
        const itemName = String(item?.name || "").trim().toLowerCase();
        const itemValue = String(item?.value || "").trim();
        const looksLikeNameField = itemName === "name" || itemName === "이름";
        return !(looksLikeNameField && itemValue === originalPointName);
      })
      .map(
        (item) => `
          <div class="detail-row">
            <dt>${escapeHtml(item.name)}</dt>
            <dd>${escapeHtml(item.value || "-")}</dd>
          </div>
        `
      )
      .join("");

    pointDetailsEl.innerHTML = `
      <div class="details-header">
        <strong>${escapeHtml(point.name)}</strong>
        <span>${escapeHtml(point.routeName || DEFAULT_ROUTE_NAME)}</span>
      </div>
      <dl class="detail-list">
        ${rows
          .map(
            (row) => `
              <div class="detail-row">
                <dt>${escapeHtml(row.label)}</dt>
                <dd>${escapeHtml(row.value)}</dd>
              </div>
            `
          )
          .join("")}
        ${extendedRows}
      </dl>
    `;
  }

  function setEmptyPathDetails() {
    pathDetailsEl.classList.add("empty");
    pathDetailsEl.innerHTML = '<p class="details-empty">경로를 선택하세요.</p>';
  }

  function renderPathDetails(pathItem) {
    if (!pathItem) {
      setEmptyPathDetails();
      return;
    }

    pathDetailsEl.classList.remove("empty");
    pathDetailsEl.innerHTML = `
      <div class="details-header">
        <strong>${escapeHtml(pathItem.name)}</strong>
        <span>${escapeHtml(pathItem.routeName || DEFAULT_ROUTE_NAME)}</span>
      </div>
      <dl class="detail-list">
        <div class="detail-row">
          <dt>파일</dt>
          <dd>${escapeHtml(pathItem.fileName || "-")}</dd>
        </div>
        <div class="detail-row">
          <dt>좌표 수</dt>
          <dd>${escapeHtml(String(pathItem.coordinates.length))}</dd>
        </div>
        <div class="detail-row">
          <dt>설명</dt>
          <dd>${escapeHtml(pathItem.description || "-")}</dd>
        </div>
      </dl>
    `;
  }

  function toExtendedDataObject(list) {
    return list.reduce((acc, item) => {
      acc[item.name] = item.value;
      return acc;
    }, {});
  }

  function fillForm(point) {
    renderFormRouteOptions(point?.routeName || selectedRouteName || "");
    formEls.name.value = point?.name || "";
    formEls.fileName.value = point?.fileName || "직접 추가";
    formEls.lat.value = point?.lat ?? "";
    formEls.lng.value = point?.lng ?? "";
    formEls.description.value = point?.description || "";
    deletePointButtonEl.disabled = !point;
  }

  function fillPathForm(pathItem) {
    renderPathRouteOptions(pathItem?.routeName || selectedRouteName || "");
    pathFormEls.name.value = pathItem?.name || "";
    pathFormEls.description.value = pathItem?.description || "";
    deletePathButtonEl.disabled = !pathItem;
  }

  function clearForm(lat, lng) {
    fillForm(null);
    if (Number.isFinite(lat)) {
      formEls.lat.value = lat;
    }
    if (Number.isFinite(lng)) {
      formEls.lng.value = lng;
    }
  }

  function normalizeExtra(value) {
    if (!value.trim()) {
      return [];
    }

    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("추가 정보는 JSON 객체 형식이어야 합니다.");
    }

    return Object.entries(parsed).map(([name, itemValue]) => ({
      name,
      value: itemValue == null ? "" : String(itemValue),
    }));
  }

  function createCustomPoint(lat, lng) {
    const createdOrder = Date.now();
    return {
      id: `custom-${createdOrder}`,
      source: "custom",
      createdOrder,
      routeName: normalizeRouteName(selectedRouteName),
      fileName: "직접 추가",
      name: "이름 없음",
      description: "",
      address: "",
      phoneNumber: "",
      styleUrl: "",
      rawCoordinates: `${lng},${lat}`,
      lat,
      lng,
      altitude: null,
      extendedData: [],
    };
  }

  function beginRelocateMode(point) {
    if (!mapReady || !point) {
      return;
    }

    addPointMode = false;
    relocatePointId = point.id;
    updatePointModeButtons();

    if (mapMouseMoveHandler) {
      window.kakao.maps.event.removeListener(map, "mousemove", mapMouseMoveHandler);
    }

    mapMouseMoveHandler = (mouseEvent) => {
      const lat = Number(mouseEvent.latLng.getLat().toFixed(7));
      const lng = Number(mouseEvent.latLng.getLng().toFixed(7));
      ensureDraftMarker(lat, lng);
    };

    window.kakao.maps.event.addListener(map, "mousemove", mapMouseMoveHandler);
    ensureDraftMarker(point.lat, point.lng);
    renderPoints();
    setStatus("정류장 수정 모드입니다. 지도나 다른 정류장을 클릭하거나, 선택한 정류장 마커를 끌어 위치를 옮기세요. 취소는 Esc입니다.", false);
  }
  function setAddPointMode(enabled) {
    addPointMode = enabled;
    if (enabled) {
      stopObservationAreaDrawMode();
      if (!selectedRouteName) {
        selectedRouteName = TEMP_NEW_ROUTE_NAME;
      }
      selectedPointId = null;
      selectedPathId = null;
      stopRelocateMode();
      renderFormRouteOptions(selectedRouteName || "");
    }

    updatePointModeButtons();

    if (enabled) {
      setStatus(
        selectedRouteName
          ? `정류장 추가 모드입니다. 현재 노선은 ${selectedRouteName === TEMP_NEW_ROUTE_NAME ? "새 노선" : selectedRouteName}입니다. 지도에서 위치를 클릭하세요.`
          : "정류장 추가 모드입니다. 먼저 노선을 입력한 뒤 지도에서 위치를 클릭하세요.",
        false
      );
    } else if (!selectedPointId) {
      clearDraftMarker();
    }
  }
  function relocatePointToPosition(lat, lng) {
    if (!relocatePointId) {
      return false;
    }

    ensureDraftMarker(lat, lng);
    const confirmed = window.confirm("\uC218\uC815\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?");
    if (confirmed) {
      pushUndoSnapshot();
      persistPointPosition(relocatePointId, lat, lng);
      selectedPointId = relocatePointId;
      stopRelocateMode();
      refreshUI();
      setStatus(`\uD3EC\uC778\uD2B8 \uC704\uCE58\uB97C \uC704\uB3C4 ${lat}, \uACBD\uB3C4 ${lng}\uB85C \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4.`, false);
    } else {
      stopRelocateMode();
      refreshUI();
      setStatus("\uD3EC\uC778\uD2B8 \uC218\uC815 \uBAA8\uB4DC\uB97C \uC885\uB8CC\uD588\uC2B5\uB2C8\uB2E4.", false);
    }

    return true;
  }

  function handleStartPointEditMode() {
    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 정류장 수정 모드를 사용할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    if (!point) {
      setStatus("수정할 정류장을 먼저 선택하세요.", true);
      return;
    }

    openPointFormSection();
    stopObservationAreaDrawMode();
    setAddPointMode(false);
    beginRelocateMode(point);
  }
  function persistPointPosition(pointId, lat, lng) {
    const point = getPointById(pointId);
    if (!point) {
      return;
    }

    if (point.source === "custom") {
      const index = customPoints.findIndex((item) => item.id === pointId);
      const altitude = customPoints[index].altitude;
      customPoints[index] = {
        ...customPoints[index],
        lat,
        lng,
        rawCoordinates: altitude == null ? `${lng},${lat}` : `${lng},${lat},${altitude}`,
      };
      saveCustomPoints();
      return;
    }

    const current = normalizeUploadedPoint(point);
    pointOverrides[pointId] = {
      routeName: current.routeName,
      name: current.name,
      fileName: current.fileName,
      lat,
      lng,
      altitude: current.altitude,
      phoneNumber: current.phoneNumber,
      address: current.address,
      description: current.description,
      rawCoordinates: current.altitude == null ? `${lng},${lat}` : `${lng},${lat},${current.altitude}`,
      extendedData: current.extendedData,
    };
    saveOverrides();
  }

  function handleMapClick(mouseEvent) {
    const lat = Number(mouseEvent.latLng.getLat().toFixed(7));
    const lng = Number(mouseEvent.latLng.getLng().toFixed(7));
    hidePathContextMenu();
    infoWindows.forEach((item) => item.close());
    analysisInfoWindows.forEach((item) => item.close());
    designedRouteInfoWindows.forEach((item) => item.close());
    designedRouteInfoWindows = [];

    if (observationAreaDrawMode) {
      workingObservationAreaPoints = workingObservationAreaPoints.concat([{ lat, lng }]);
      renderObservationAreas();
      renderObservationAreaPanel();
      setStatus(`관찰 구역 꼭짓점 ${workingObservationAreaPoints.length}개를 추가했습니다. 3개 이상이 되면 저장할 수 있습니다.`, false);
      return;
    }

    if (drawPathMode || editPathMode) {
      if (editPathMode && selectedPathVertexIndex != null) {
        const movedIndex = selectedPathVertexIndex;
        workingPathCoordinates[selectedPathVertexIndex] = {
          ...workingPathCoordinates[selectedPathVertexIndex],
          lat,
          lng,
        };
        workingPathCoordinates = expandMovedVertexWithMidpoints(workingPathCoordinates, movedIndex);
        persistWorkingPath({
          closeModes: true,
          successMessage: () => "선택한 지점을 이동하고 경로 수정 모드를 종료했습니다.",
        });
        return;
      }

      if (editPathMode && !pathExtendMode) {
        setStatus("경로 편집 중입니다. 먼저 이동할 꼭짓점을 선택한 뒤 지도에서 새 위치를 클릭하세요. 경로를 연장하려면 마지막 꼭짓점의 메뉴를 사용하세요.", true);
        return;
      }

      workingPathCoordinates = [
        ...workingPathCoordinates,
        {
          lat,
          lng,
          altitude: null,
        },
      ];
      syncPathPreview();
      updatePathEditorUi();
      setStatus(
        drawPathMode
          ? `경로 좌표 ${workingPathCoordinates.length}개를 추가했습니다. 마지막 점을 다시 클릭하면 저장됩니다.`
          : "경로 연장 지점을 추가했습니다. 연장 모드는 유지됩니다. 빨간 끝점을 다시 클릭하면 종료합니다.",
        false
      );
      return;
    }

    if (relocatePointId) {
      relocatePointToPosition(lat, lng);
      return;
    }

    if (!addPointMode) {
      if (selectedRouteName || selectedPointId || selectedPathId || selectedObservationAreaId || highlightedRouteNames.length) {
        hasClearedSelection = true;
        selectedRouteName = null;
        selectedPointId = null;
        selectedPathId = null;
        selectedObservationAreaId = null;
        clearHighlightedRoutes();
        setEmptyDetails();
        setEmptyPathDetails();
        refreshUI();
        setStatus("선택을 초기화했습니다.", false);
      }
      return;
    }

    clearForm(lat, lng);
    renderFormRouteOptions(selectedRouteName);
    ensureDraftMarker(lat, lng);
    formEls.name.focus();
    setStatus(`정류장 위치를 선택했습니다. 현재 노선은 ${selectedRouteName} 입니다.`, false);
  }

  function selectPoint(point, marker, infoWindow) {
    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 정류장을 선택할 수 없습니다.", true);
      return;
    }

    stopPathModes();
    stopRelocateMode();
    hasClearedSelection = false;
    selectedRouteName = point.routeName;
    addHighlightedRoute(point.routeName);
    selectedPointId = point.id;
    selectedPathId = null;
    renderPointDetails(point);
    fillForm(point);
    renderRouteList();
    renderRoutePointList();
    scrollSelectedPointRowIntoView();

    infoWindows.forEach((item) => item.close());
    if (marker && infoWindow && mapReady) {
      infoWindow.open(map, marker);
      map.panTo(marker.getPosition());
    }
    setStatus(`정류장 "${point.name}" 을 선택했습니다. 필요하면 정류장 수정 모드를 사용하세요.`, false);
  }

  function selectPointById(pointId) {
    const markerEntry = markers.find((item) => item.id === pointId);
    if (!markerEntry) {
      return;
    }

    const infoWindow = infoWindows[markers.indexOf(markerEntry)];
    selectPoint(markerEntry.point, markerEntry.marker, infoWindow);
  }

  function selectPath(pathItem) {
    stopPathModes();
    stopRelocateMode();
    hasClearedSelection = false;
    selectedRouteName = pathItem.routeName;
    addHighlightedRoute(pathItem.routeName);
    selectedPointId = null;
    selectedPathId = pathItem.id;
    fillPathForm(pathItem);
    refreshUI();
    setStatus(`${pathItem.routeName} 경로를 선택했습니다.`, false);
  }

  function showPathInfo(pathItem, position) {
    designedRouteInfoWindows.forEach((item) => item.close());
    designedRouteInfoWindows = [];

    const totalDistanceMeters = Number(pathItem.totalDistanceMeters || pathItem.estimatedDistanceMeters) || calculatePathDistanceMeters(pathItem);
    const routeTitle = pathItem.routeName || pathItem.name || "노선";

    const infoWindow = new window.kakao.maps.InfoWindow({
      position,
      removable: false,
      content: `
        <div style="padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
          <strong>${escapeHtml(routeTitle)}</strong><br>
          \uCD1D\uAC70\uB9AC: ${escapeHtml(formatDistanceKm(totalDistanceMeters))}Km<br>
          \uCD1D \uC6B4\uD589\uC2DC\uAC04: ${escapeHtml(formatPathDuration(pathItem))}
        </div>
      `,
    });

    infoWindow.open(map);
    designedRouteInfoWindows.push(infoWindow);
  }

  function renderPoints() {
    const points = getAllPoints();
    const paths = getAllPaths();
    if (!mapReady) {
      return;
    }

    clearMap();
    if (!points.length && !paths.length) {
      setEmptyDetails();
      clearDraftMarker();
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    const routeOrderMap = new Map();

    getRoutes().forEach((routeName) => {
      getPointsInRoute(routeName).forEach((point, index) => {
        routeOrderMap.set(point.id, index + 1);
      });
    });

    const hasRouteSelection = highlightedRouteNames.length > 0;

    paths.forEach((pathItem) => {
      if (!isRouteVisible(pathItem.routeName)) {
        return;
      }

      const routeSetting = getRouteSetting(pathItem.routeName);
      if (editPathMode && pathItem.id === selectedPathId) {
        return;
      }
      const polylinePath = pathItem.coordinates.map(
        (coordinate) => new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng)
      );
      const isHighlighted = hasRouteSelection && highlightedRouteNames.includes(pathItem.routeName);
      const isMuted = !hasRouteSelection || !isHighlighted;
      const designedStrokeWeight = pathItem.designedRoute ? 10 : null;
      const designedOutline = pathItem.designedRoute
        ? new window.kakao.maps.Polyline({
            map,
            path: polylinePath,
            strokeWeight: 8,
            strokeColor: "#111111",
            strokeOpacity: isMuted ? 0.52 : 0.98,
            strokeStyle: "solid",
            clickable: false,
            endArrow: false,
          })
        : null;
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: polylinePath,
        strokeWeight: pathItem.designedRoute ? (isMuted ? 3 : 4) : (pathItem.id === selectedPathId ? 7 : isHighlighted ? 5 : 2),
        strokeColor: pathItem.designedRoute ? "#d8c36a" : routeSetting.color,
        strokeOpacity: pathItem.designedRoute ? (isMuted ? 0.7 : 0.98) : pathItem.id === selectedPathId ? 1 : isHighlighted ? 0.96 : 0.66,
        strokeStyle: "solid",
        clickable: true,
        endArrow: true,
      });

      window.kakao.maps.event.addListener(polyline, "click", (mouseEvent) => {
        if (relocatePointId) {
          const lat = Number(mouseEvent.latLng.getLat().toFixed(7));
          const lng = Number(mouseEvent.latLng.getLng().toFixed(7));
          relocatePointToPosition(lat, lng);
          return;
        }
        if (window.kakao && window.kakao.maps && window.kakao.maps.event) {
          window.kakao.maps.event.preventMap();
        }
        selectPath(pathItem);
        showPathInfo(pathItem, mouseEvent.latLng);
      });

      if (designedOutline) {
        polylines.push({ id: `${pathItem.id}-outline`, polyline: designedOutline, pathItem });
      }
      polylines.push({ id: pathItem.id, polyline, pathItem });
      polylinePath.forEach((position) => bounds.extend(position));
    });

    points.forEach((point) => {
      if (!isRouteVisible(point.routeName)) {
        return;
      }

      const routeSetting = getRouteSetting(point.routeName);
      const position = new window.kakao.maps.LatLng(point.lat, point.lng);
      const isRelocatingPoint = relocatePointId === point.id;
      const isHighlighted = hasRouteSelection && highlightedRouteNames.includes(point.routeName);
      const isMuted = !hasRouteSelection || !isHighlighted;
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        title: point.name,
        draggable: isRelocatingPoint,
        opacity: isMuted ? 0.9 : 1,
        image: createMarkerImage(
          routeSetting.color,
          point.id === selectedPointId,
          String(routeOrderMap.get(point.id) || ""),
          isMuted && point.id !== selectedPointId
        ),
      });

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;">${escapeHtml(point.name)}</div>`,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.event) {
          window.kakao.maps.event.preventMap();
        }
        if (relocatePointId) {
          if (point.id === relocatePointId) {
            setStatus("선택한 정류장 마커를 끌어 놓거나, 지도에서 이동할 위치를 클릭하세요.", false);
            return;
          }
          relocatePointToPosition(point.lat, point.lng);
          return;
        }
        selectPoint(point, marker, infoWindow);
      });

      if (isRelocatingPoint) {
        window.kakao.maps.event.addListener(marker, "dragstart", () => {
          setStatus("정류장 마커를 끌어 원하는 위치에 놓으세요.", false);
        });

        window.kakao.maps.event.addListener(marker, "drag", () => {
          const draggedPosition = marker.getPosition();
          const lat = Number(draggedPosition.getLat().toFixed(7));
          const lng = Number(draggedPosition.getLng().toFixed(7));
          ensureDraftMarker(lat, lng);
        });

        window.kakao.maps.event.addListener(marker, "dragend", () => {
          const draggedPosition = marker.getPosition();
          const lat = Number(draggedPosition.getLat().toFixed(7));
          const lng = Number(draggedPosition.getLng().toFixed(7));
          relocatePointToPosition(lat, lng);
        });
      }

      markers.push({ id: point.id, marker, point });
      infoWindows.push(infoWindow);
      bounds.extend(position);
    });

    if (shouldFitMapToData && !bounds.isEmpty()) {
      map.setBounds(bounds);
      shouldFitMapToData = false;
    }

    if (selectedPointId) {
      const selectedMarker = markers.find((item) => item.id === selectedPointId);
      if (selectedMarker) {
        const infoWindow = infoWindows[markers.indexOf(selectedMarker)];
        infoWindow.open(map, selectedMarker.marker);
      }
    }
  }

  function refreshUI() {
    ensureRouteSettings();
    ensureSelectedRoute();
    ensureMergeRoutes();
    ensureSelectedPoint();
    ensureSelectedPath();
    updatePointModeButtons();
    updateCounts();
    renderRouteList();
    renderRouteMergePanel();
    renderVillageBusDesignPanel();
    renderObservationAreaPanel();
    renderRoutePointList();
    renderMoveRouteOptions();
    renderPoints();
    if (addPointMode) {
      renderPointDetails(null);
    } else {
      renderPointDetails(getPointById(selectedPointId));
      fillForm(getPointById(selectedPointId));
    }
    renderPathDetails(getPathById(selectedPathId));
    fillPathForm(getPathById(selectedPathId));
    updatePathEditorUi();
    renderObservationAreas();
    if (drawPathMode || editPathMode) {
      syncPathPreview();
    }
    if (latestAnalysisReport) {
      renderAnalysisRangeOverlays(latestAnalysisReport.local);
    }
    saveUiState();
  }

  function handleDeletePoint() {
    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 정류장을 삭제할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    if (!point) {
      setStatus("삭제할 정류장을 먼저 선택하세요.", true);
      return;
    }

    const confirmed = window.confirm(`정류장 "${point.name}" 을 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();
    if (point.source === "custom") {
      customPoints = customPoints.filter((item) => item.id !== selectedPointId);
      saveCustomPoints();
    } else {
      pointOverrides[selectedPointId] = {
        ...(pointOverrides[selectedPointId] || {}),
        deleted: true,
      };
      saveOverrides();
    }

    stopRelocateMode();
    shouldFitMapToData = false;
    selectedPointId = null;
    refreshUI();
    setStatus(`정류장 "${point.name}" 을 삭제했습니다.`, false);
  }

  function handleDeleteRoute(routeName) {
    const normalizedRouteName = normalizeRouteName(routeName);
    const routePointCount = getAllPoints().filter((point) => point.routeName === normalizedRouteName).length;
    const routePathCount = getAllPaths().filter((path) => path.routeName === normalizedRouteName).length;
    const confirmed = window.confirm(
      `노선 "${normalizedRouteName}" 과 하위 정류장 ${routePointCount}개, 경로 ${routePathCount}개를 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();
    customPoints = customPoints.filter((point) => point.routeName !== normalizedRouteName);
    saveCustomPoints();

    uploadedPoints
      .filter((point) => point.routeName === normalizedRouteName)
      .forEach((point) => {
        pointOverrides[point.id] = {
          ...(pointOverrides[point.id] || {}),
          deleted: true,
        };
      });
    saveOverrides();

    getAllPaths()
      .filter((pathItem) => pathItem.routeName === normalizedRouteName)
      .forEach((pathItem) => {
        if (pathItem.source === "custom-path") {
          customPaths = customPaths.filter((customPath) => customPath.id !== pathItem.id);
        } else {
          pathOverrides[pathItem.id] = {
            ...(pathOverrides[pathItem.id] || {}),
            deleted: true,
          };
        }
      });
    saveCustomPaths();
    savePathOverrides();

    routeSettings[normalizedRouteName] = {
      ...getRouteSetting(normalizedRouteName),
      deleted: true,
      visible: false,
    };
    saveRouteSettings();

    if (selectedRouteName === normalizedRouteName) {
      selectedRouteName = null;
      selectedPointId = null;
      selectedPathId = null;
    }

    stopRelocateMode();
    refreshUI();
    setStatus(`노선 "${normalizedRouteName}" 을 삭제했습니다.`, false);
  }

  function movePointToRoute(pointId, targetRouteName) {
    const point = getPointById(pointId);
    if (!point || !targetRouteName) {
      return;
    }

    if (point.source === "custom") {
      const index = customPoints.findIndex((item) => item.id === pointId);
      customPoints[index] = {
        ...customPoints[index],
        routeName: normalizeRouteName(targetRouteName),
      };
      saveCustomPoints();
      return;
    }

    const current = normalizeUploadedPoint(point);
    pointOverrides[pointId] = {
      routeName: normalizeRouteName(targetRouteName),
      name: current.name,
      fileName: current.fileName,
      lat: current.lat,
      lng: current.lng,
      altitude: current.altitude,
      phoneNumber: current.phoneNumber,
      address: current.address,
      description: current.description,
      rawCoordinates: current.rawCoordinates,
      extendedData: current.extendedData,
    };
    saveOverrides();
  }

  function handleMovePoint() {
    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 정류장을 이동할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    const targetRouteName = normalizeRouteName(moveRouteSelectEl.value);

    if (!point) {
      setStatus("이동할 정류장을 먼저 선택하세요.", true);
      return;
    }

    if (!moveRouteSelectEl.value) {
      setStatus("이동할 노선을 선택하세요.", true);
      return;
    }

    pushUndoSnapshot();
    movePointToRoute(point.id, targetRouteName);
    selectedRouteName = targetRouteName;
    selectedPointId = point.id;
    stopRelocateMode();
    refreshUI();
    setStatus(`정류장을 ${targetRouteName} 노선으로 이동했습니다.`, false);
  }

  function persistWorkingPath(options = {}) {
    const { closeModes = false, successMessage } = options;

    if (workingPathCoordinates.length < 2) {
      throw new Error("경로에는 최소 2개 좌표가 필요합니다.");
    }

    const routeName = getSelectedPathRouteName();
    const rawCoordinates = workingPathCoordinates
      .map((coordinate) =>
        coordinate.altitude == null
          ? `${coordinate.lng},${coordinate.lat}`
          : `${coordinate.lng},${coordinate.lat},${coordinate.altitude}`
      )
      .join(" ");

    const selectedPath = getPathById(selectedPathId);
    const updatedPath = {
      ...(selectedPath || {}),
      routeName,
      name: pathFormEls.name.value.trim() || selectedPath?.name || "이름 없는 경로",
      description: pathFormEls.description.value.trim(),
      coordinates: workingPathCoordinates.map((coordinate) => ({ ...coordinate })),
      rawCoordinates,
    };

    pushUndoSnapshot();
    if (drawPathMode || !selectedPath) {
      const customPath = {
        id: `custom-path-${Date.now()}`,
        source: "custom-path",
        routeName,
        fileName: "직접 추가",
        name: updatedPath.name,
        description: updatedPath.description,
        coordinates: updatedPath.coordinates,
        rawCoordinates,
      };
      customPaths = [customPath, ...customPaths];
      saveCustomPaths();
      selectedPathId = customPath.id;
    } else if (selectedPath.source === "custom-path") {
      const index = customPaths.findIndex((pathItem) => pathItem.id === selectedPath.id);
      if (index >= 0) {
        customPaths[index] = {
          ...customPaths[index],
          routeName: updatedPath.routeName,
          name: updatedPath.name,
          description: updatedPath.description,
          coordinates: updatedPath.coordinates,
          rawCoordinates,
        };
        saveCustomPaths();
      }
    } else {
      pathOverrides[selectedPath.id] = {
        routeName: updatedPath.routeName,
        name: updatedPath.name,
        description: updatedPath.description,
        coordinates: updatedPath.coordinates,
        rawCoordinates: updatedPath.rawCoordinates,
      };
      savePathOverrides();
    }

    selectedRouteName = updatedPath.routeName;

    if (closeModes) {
      drawPathMode = false;
      editPathMode = false;
      pathExtendMode = false;
      selectedPathVertexIndex = null;
      workingPathCoordinates = [];
      clearPathEditorOverlay();
    } else {
      selectedPathVertexIndex = null;
      workingPathCoordinates = updatedPath.coordinates.map((coordinate) => ({ ...coordinate }));
    }

    updatePathEditorUi();
    refreshUI();
    if (successMessage) {
      setStatus(successMessage(updatedPath), false);
    }

    return updatedPath;
  }

  function handlePathFormSubmit() {
    try {
      const selectedPath = getPathById(selectedPathId);
      if (!drawPathMode && !editPathMode && selectedPath?.designedRoute === true) {
        return saveDesignedPathAsRegularPath();
      }
      const updatedPath = persistWorkingPath({
        closeModes: true,
        successMessage: (pathItem) => `경로 "${pathItem.name}" 을 저장했습니다.`,
      });
      return updatedPath;
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  function handleDeletePath() {
    const selectedPath = getPathById(selectedPathId);
    if (!selectedPath) {
      setStatus("삭제할 경로를 먼저 선택하세요.", true);
      return;
    }

    const confirmed = window.confirm(`경로 "${selectedPath.name}" 을 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();
    if (selectedPath.source === "custom-path") {
      customPaths = customPaths.filter((pathItem) => pathItem.id !== selectedPath.id);
      saveCustomPaths();
    } else {
      pathOverrides[selectedPath.id] = {
        ...(pathOverrides[selectedPath.id] || {}),
        deleted: true,
      };
      savePathOverrides();
    }
    selectedPathId = null;
    stopPathModes();
    updatePathEditorUi();
    refreshUI();
    setStatus(`경로 "${selectedPath.name}" 을 삭제했습니다.`, false);
  }

  function handleDeleteAllPaths() {
    const paths = getAllPaths();
    if (!paths.length) {
      setStatus("삭제할 경로가 없습니다.", true);
      return;
    }

    const confirmed = window.confirm(`모든 경로 ${paths.length}개를 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    pushUndoSnapshot();
    customPaths = [];
    saveCustomPaths();

    const nextPathOverrides = { ...pathOverrides };
    uploadedPaths.map(normalizeUploadedPath).forEach((pathItem) => {
      nextPathOverrides[pathItem.id] = {
        ...(nextPathOverrides[pathItem.id] || {}),
        deleted: true,
      };
    });
    pathOverrides = nextPathOverrides;
    savePathOverrides();

    selectedPathId = null;
    stopPathModes();
    updatePathEditorUi();
    refreshUI();
    setStatus(`모든 경로 ${paths.length}개를 삭제했습니다.`, false);
  }

  function buildPointFromForm(basePoint) {
    const lat = Number(formEls.lat.value);
    const lng = Number(formEls.lng.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("위도와 경도를 입력하세요.");
    }

    const routeName = getSelectedFormRouteName();
    if (!routeName) {
      throw new Error("노선명을 입력하세요.");
    }

    const altitude = basePoint.altitude ?? null;
    return {
      ...basePoint,
      routeName,
      name: formEls.name.value.trim() || "이름 없음",
      fileName: formEls.fileName.value.trim() || basePoint.fileName || "직접 추가",
      lat,
      lng,
      altitude,
      phoneNumber: basePoint.phoneNumber || "",
      address: basePoint.address || "",
      description: formEls.description.value.trim(),
      rawCoordinates: altitude == null ? `${lng},${lat}` : `${lng},${lat},${altitude}`,
      ridership: normalizeRidershipValue(basePoint.ridership),
      extendedData: withRidershipExtendedData(basePoint.extendedData, basePoint.ridership),
    };
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function parseCsvRows(text) {
    const rows = [];
    let currentRow = [];
    let currentValue = "";
    let inQuotes = false;
    const source = String(text || "").replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const nextChar = source[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === ",") {
        currentRow.push(currentValue);
        currentValue = "";
        continue;
      }

      if (!inQuotes && (char === "\n" || char === "\r")) {
        if (char === "\r" && nextChar === "\n") {
          index += 1;
        }
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
        continue;
      }

      currentValue += char;
    }

    if (currentValue || currentRow.length) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => String(cell || "").trim()));
  }

  function buildRidershipCsv(points) {
    const rows = [
      ["stop_key", "route_name", "stop_name", "lat", "lng", "boarding_count"],
      ...points.map((point) => [
        getPointStopKey(point),
        point.routeName,
        point.name,
        Number(point.lat).toFixed(6),
        Number(point.lng).toFixed(6),
        normalizeRidershipValue(point.ridership) == null ? "" : String(normalizeRidershipValue(point.ridership)),
      ]),
    ];

    return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
  }

  function getVisiblePointsForRidershipExport() {
    return getAllPoints()
      .filter((point) => isRouteVisible(point.routeName))
      .sort((left, right) => {
        const leftRouteOrder = Number(getRouteSetting(left.routeName).routeOrder);
        const rightRouteOrder = Number(getRouteSetting(right.routeName).routeOrder);
        if (left.routeName !== right.routeName && Number.isFinite(leftRouteOrder) && Number.isFinite(rightRouteOrder)) {
          return leftRouteOrder - rightRouteOrder;
        }
        if (left.routeName !== right.routeName) {
          return String(left.routeName).localeCompare(String(right.routeName), "ko");
        }
        return comparePointsByOrder(left, right);
      });
  }

  function downloadRidershipCsv() {
    const points = getVisiblePointsForRidershipExport();
    if (!points.length) {
      setStatus("CSV로 내보낼 표시 중인 정류장이 없습니다.", true);
      return;
    }

    const blob = new Blob([buildRidershipCsv(points)], {
      type: "text/csv;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stop-ridership-${formatAutoSaveTimestamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setStatus(`표시 중인 정류장 ${points.length}개의 CSV를 다운로드했습니다. boarding_count 열을 채운 뒤 다시 업로드하세요.`, false);
  }

  function parseRidershipCsv(text) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) {
      throw new Error("승객 CSV에 데이터 행이 없습니다.");
    }

    const headerMap = rows[0].reduce((acc, cell, index) => {
      acc[String(cell || "").trim().toLowerCase()] = index;
      return acc;
    }, {});

    if (!Object.prototype.hasOwnProperty.call(headerMap, "stop_key")) {
      throw new Error("승객 CSV에 stop_key 열이 없습니다.");
    }
    if (!Object.prototype.hasOwnProperty.call(headerMap, "boarding_count")) {
      throw new Error("승객 CSV에 boarding_count 열이 없습니다.");
    }

    return rows.slice(1).map((row) => ({
      stopKey: String(row[headerMap.stop_key] || "").trim(),
      routeName: String(row[headerMap.route_name] || "").trim(),
      stopName: String(row[headerMap.stop_name] || "").trim(),
      lat: row[headerMap.lat],
      lng: row[headerMap.lng],
      boardingCount: row[headerMap.boarding_count],
    })).filter((record) => record.stopKey);
  }

  function applyRidershipRecordsToWorkspace(records) {
    const recordMap = new Map(
      (Array.isArray(records) ? records : [])
        .map((record) => ({
          ...record,
          stopKey: String(record?.stopKey || "").trim(),
          boardingCount: normalizeRidershipValue(record?.boardingCount),
        }))
        .filter((record) => record.stopKey)
        .map((record) => [record.stopKey, record])
    );

    let customChanged = false;
    let overrideChanged = false;
    let appliedCount = 0;

    customPoints = customPoints.map((point) => {
      const record = recordMap.get(getPointStopKey(point));
      if (!record) {
        return point;
      }
      appliedCount += 1;
      customChanged = true;
      return normalizeCustomPoint({
        ...point,
        ridership: record.boardingCount,
        extendedData: withRidershipExtendedData(point.extendedData, record.boardingCount),
      });
    });

    getAllPoints()
      .filter((point) => point.source === "uploaded")
      .forEach((point) => {
        const record = recordMap.get(getPointStopKey(point));
        if (!record) {
          return;
        }
        appliedCount += 1;
        overrideChanged = true;
        const currentOverride = pointOverrides[point.id] || {};
        const baseExtendedData = Object.prototype.hasOwnProperty.call(currentOverride, "extendedData")
          ? currentOverride.extendedData
          : point.extendedData;
        pointOverrides[point.id] = {
          ...currentOverride,
          ridership: record.boardingCount,
          extendedData: withRidershipExtendedData(baseExtendedData, record.boardingCount),
        };
      });

    if (customChanged) {
      saveCustomPoints();
    }
    if (overrideChanged) {
      saveOverrides();
    }

    return { appliedCount };
  }

  async function loadRidershipStoreFromServer() {
    const response = await window.fetch("/api/stop-ridership");
    if (!response.ok) {
      throw new Error("정류장 탑승객 저장소를 불러오지 못했습니다.");
    }
    const payload = await response.json();
    return applyRidershipRecordsToWorkspace(payload.records || []);
  }

  async function importRidershipCsvFile(file) {
    if (!file) {
      return;
    }

    const records = parseRidershipCsv(await file.text());
    if (!records.length) {
      throw new Error("승객 CSV에 반영할 정류장 행이 없습니다.");
    }

    const response = await window.fetch("/api/stop-ridership-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "승객 CSV 업로드에 실패했습니다.");
    }

    const applied = applyRidershipRecordsToWorkspace(records);
    refreshUI();
    setStatus(
      `승객 CSV ${records.length}행을 처리했습니다. 서버 저장 ${payload.savedCount || 0}건, 초기화 ${payload.clearedCount || 0}건, 현재 화면 반영 ${applied.appliedCount}건입니다.`,
      false
    );
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 정류장을 저장할 수 없습니다.", true);
      return;
    }

    try {
      const selectedPoint = getPointById(selectedPointId);
      pushUndoSnapshot();

      if (addPointMode) {
        if (!selectedRouteName) {
          throw new Error("정류장을 만들기 전에 노선을 먼저 선택하세요.");
        }

        const lat = Number(formEls.lat.value);
        const lng = Number(formEls.lng.value);
        const point = buildPointFromForm(createCustomPoint(lat, lng));
        customPoints = [...customPoints, point];
        saveCustomPoints();
        selectedPointId = point.id;
        selectedRouteName = point.routeName;
      } else if (selectedPoint && selectedPoint.source === "custom") {
        const index = customPoints.findIndex((point) => point.id === selectedPoint.id);
        customPoints[index] = buildPointFromForm(customPoints[index]);
        saveCustomPoints();
        selectedPointId = customPoints[index].id;
        selectedRouteName = customPoints[index].routeName;
      } else if (selectedPoint && selectedPoint.source === "uploaded") {
        const updatedPoint = buildPointFromForm(selectedPoint);
        pointOverrides[selectedPoint.id] = {
          routeName: updatedPoint.routeName,
          name: updatedPoint.name,
          fileName: updatedPoint.fileName,
          lat: updatedPoint.lat,
          lng: updatedPoint.lng,
          altitude: updatedPoint.altitude,
          phoneNumber: updatedPoint.phoneNumber,
          address: updatedPoint.address,
          description: updatedPoint.description,
          rawCoordinates: updatedPoint.rawCoordinates,
          extendedData: updatedPoint.extendedData,
        };
        saveOverrides();
        selectedRouteName = updatedPoint.routeName;
      } else {
        throw new Error("저장할 정류장을 먼저 선택하거나 정류장 추가 모드를 사용하세요.");
      }

      stopRelocateMode();
      setAddPointMode(false);
      refreshUI();
      setStatus("정류장을 저장했습니다.", false);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".kml"));
    if (!files.length) {
      setStatus("KML 파일만 업로드할 수 있습니다.", true);
      return;
    }

    const fileSummaries = [];
    const points = [];
    const paths = [];
    const areas = [];

    for (const file of files) {
      const text = await file.text();
      const parsed = parseKml(text, file.name);
      fileSummaries.push({
        name: file.name,
        pointCount: parsed.points.length,
        pathCount: parsed.paths.length,
        areaCount: parsed.areas.length,
      });
      points.push(...parsed.points);
      paths.push(...parsed.paths);
      areas.push(...parsed.areas);
    }

    pushUndoSnapshot();
    uploadedPoints = [...uploadedPoints, ...points];
    uploadedPaths = [...uploadedPaths, ...paths];
    uploadedFileSummaries = [...uploadedFileSummaries, ...fileSummaries];
    observationAreas = [...observationAreas, ...areas];
    restoreRouteSettingsFromImportedKml(points, paths);
    saveUploadedWorkspace();
    saveRouteSettings();
    saveObservationAreas();
    shouldFitMapToData = true;
    fileCountEl.textContent = String(uploadedFileSummaries.length);
    renderFileList(uploadedFileSummaries);
    stopPathModes();
    stopRelocateMode();
    if (!selectedRouteName) {
      selectedRouteName = points[0]?.routeName || paths[0]?.routeName || selectedRouteName;
    }
    selectedPointId = null;
    selectedPathId = null;
    refreshUI();
    setStatus("기존 프로젝트에 정류장, 경로, 관찰 구역을 추가로 불러왔습니다.", false);
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      handleUndo();
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    if (!analysisModalEl.classList.contains("is-hidden")) {
      closeAnalysisModal();
      return;
    }

    if (drawPathMode || editPathMode) {
      stopPathModes();
      refreshUI();
      setStatus("경로 편집 모드를 취소했습니다.", false);
      return;
    }

    if (relocatePointId) {
      stopRelocateMode();
      refreshUI();
      setStatus("정류장 수정 모드를 취소했습니다.", false);
      return;
    }

    if (observationAreaDrawMode) {
      stopObservationAreaDrawMode();
      refreshUI();
      setStatus("관찰 구역 그리기 모드를 취소했습니다.", false);
      return;
    }

    if (observationAreaMoveMode) {
      observationAreaMoveMode = false;
      refreshUI();
      setStatus("관찰 구역 이동 모드를 취소했습니다.", false);
      return;
    }

    if (observationAreaEditMode) {
      observationAreaEditMode = false;
      refreshUI();
      setStatus("관찰 구역 수정 모드를 취소했습니다.", false);
      return;
    }

    if (addPointMode) {
      setAddPointMode(false);
      clearDraftMarker();
      setStatus("정류장 추가 모드를 취소했습니다.", false);
    }
  }

  function bindUploadEvents() {
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", async (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");

      try {
        await handleFiles(event.dataTransfer.files);
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    fileInput.addEventListener("change", async (event) => {
      try {
        await handleFiles(event.target.files);
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        fileInput.value = "";
      }
    });

    importRidershipCsvButtonEl?.addEventListener("click", () => {
      ridershipFileInputEl?.click();
    });

    ridershipFileInputEl?.addEventListener("change", async (event) => {
      try {
        await importRidershipCsvFile(event.target.files?.[0]);
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        event.target.value = "";
      }
    });
  }

  function bindFormEvents() {
    ensureSaveDesignedPathButton();
    bindCollapsibleToolPanels();
    syncStatLabels();
    syncSectionTitles();
    syncOptimizationFeatureVisibility();
    updateAnalyzeButtonState();
    pointDetailsToggleEl.addEventListener("click", () => {
      toggleCollapsibleSection(pointDetailsSectionEl, pointDetailsToggleEl);
    });
    pointFormToggleEl.addEventListener("click", () => {
      toggleCollapsibleSection(pointFormSectionEl, pointFormToggleEl);
    });
    resetPointButtonEl.addEventListener(
      "click",
      () => {
        if (!selectedRouteName) {
          selectedRouteName = TEMP_NEW_ROUTE_NAME;
        }
      },
      true
    );
    pointFormEl.addEventListener(
      "submit",
      () => {
        if (!selectedRouteName) {
          selectedRouteName = TEMP_NEW_ROUTE_NAME;
        }
      },
      true
    );
    addPointButtonEl.addEventListener("click", () => {
      if (drawPathMode || editPathMode) {
        setStatus("경로 편집 중에는 정류장 추가 모드를 사용할 수 없습니다.", true);
        return;
      }

      const next = !addPointMode;
      if (next) {
        stopRelocateMode();
      }
      setAddPointMode(next);
      if (next) {
        openPointFormSection();
        selectedPointId = null;
        clearForm();
        renderFormRouteOptions(selectedRouteName || "");
      }
    });

    editPointButtonEl.addEventListener("click", () => {
      if (relocatePointId) {
        stopRelocateMode();
        refreshUI();
        setStatus("정류장 수정 모드를 종료했습니다.", false);
        return;
      }
      handleStartPointEditMode();
    });

    resetPointButtonEl.addEventListener("click", () => {
      if (drawPathMode || editPathMode) {
        setStatus("경로 편집 중에는 새 정류장을 만들 수 없습니다.", true);
        return;
      }

      if (!selectedRouteName) {
        setStatus("정류장을 만들기 전에 노선을 먼저 선택하세요.", true);
        return;
      }

      selectedPointId = null;
      stopRelocateMode();
      clearForm();
      renderFormRouteOptions(selectedRouteName);
      setAddPointMode(true);
      openPointFormSection();
      setStatus(`새 정류장 정보를 입력하세요. 현재 노선은 ${selectedRouteName} 입니다.`, false);
    });

    formRouteSelectEl.addEventListener("change", () => {
      const isNewRoute = formRouteSelectEl.value === NEW_ROUTE_VALUE;
      newRouteFieldEl.classList.toggle("is-visible", isNewRoute);
      if (isNewRoute) {
        newRouteNameEl.focus();
      } else {
        newRouteNameEl.value = "";
      }
    });

    startPathDrawButtonEl.addEventListener("click", startPathDrawMode);
    startPathEditButtonEl.addEventListener("click", startPathEditMode);
    designRouteButtonEl.addEventListener("click", handleDesignRoute);
    villagePrioritySelectEl.addEventListener("change", () => {
      updateVillageBusRouteSetting({ priority: villagePrioritySelectEl.value });
    });
    mergeRouteASelectEl.addEventListener("change", () => {
      mergeRouteAName = mergeRouteASelectEl.value;
      if (mergeRouteAName === mergeRouteBName) {
        mergeRouteBName = getRoutes().find((routeName) => routeName !== mergeRouteAName) || mergeRouteBName;
      }
      renderRouteMergePanel();
    });
    mergeRouteBSelectEl.addEventListener("change", () => {
      mergeRouteBName = mergeRouteBSelectEl.value;
      if (mergeRouteAName === mergeRouteBName) {
        mergeRouteAName = getRoutes().find((routeName) => routeName !== mergeRouteBName) || mergeRouteAName;
      }
      renderRouteMergePanel();
    });
    simpleMergeCheckboxEl?.addEventListener("change", renderRouteMergePanel);
    mergeRoutesButtonEl.addEventListener("click", handleMergeRoutes);
    viewMergedRouteButtonEl.addEventListener("click", handleViewMergedRoute);
    designVillageBusRouteButtonEl.addEventListener("click", () => {
      handleVillageBusDesignRoute(designVillageBusRouteButtonEl);
    });
    resetVillageBusRouteButtonEl.addEventListener("click", handleResetDesignedRoute);
    resetDesignedRouteButtonEl.addEventListener("click", handleResetDesignedRoute);
    showAllRoutesButtonEl.addEventListener("click", () => setAllRoutesVisible(true));
    hideAllRoutesButtonEl.addEventListener("click", () => setAllRoutesVisible(false));
    toggleOriginalRoutesButtonEl?.addEventListener("click", () => {
      setRouteGroupVisible(
        getRoutes().filter((routeName) => getRouteSetting(routeName).routeGroup !== "merged"),
        toggleOriginalRoutesButtonEl.dataset.nextVisible === "true",
        "기존"
      );
    });
    toggleMergedRoutesButtonEl?.addEventListener("click", () => {
      setRouteGroupVisible(
        getRoutes().filter((routeName) => getRouteSetting(routeName).routeGroup === "merged"),
        toggleMergedRoutesButtonEl.dataset.nextVisible === "true",
        "개선"
      );
    });
    finishPathButtonEl.addEventListener("click", handlePathFormSubmit);
    if (saveDesignedPathButtonEl) {
      saveDesignedPathButtonEl.addEventListener("click", handlePathFormSubmit);
    }
    cancelPathButtonEl.addEventListener("click", () => {
      stopPathModes();
      refreshUI();
      setStatus("경로 편집 모드를 취소했습니다.", false);
    });
    saveKmlButtonEl.addEventListener("click", handleSaveKml);
    saveResetButtonEl.addEventListener("click", handleSaveAndReset);
    exportRidershipCsvButtonEl?.addEventListener("click", downloadRidershipCsv);
    analyzeRoutesButtonEl.addEventListener("click", handleAnalyzeRoutesLocal);
    compareRouteGroupsButtonEl.addEventListener("click", handleCompareRouteGroups);
    if (OPTIMIZATION_FEATURE_ENABLED && optimizeRoutesButtonEl) {
      optimizeRoutesButtonEl.addEventListener("click", handleOptimizeRoutes);
    }
    analysisModalCloseEl.addEventListener("click", closeAnalysisModal);
    analysisModalEl.addEventListener("click", (event) => {
      if (event.target === analysisModalEl) {
        closeAnalysisModal();
      }
    });
    deletePointButtonEl.addEventListener("click", handleDeletePoint);
    movePointButtonEl.addEventListener("click", handleMovePoint);
    pointFormEl.addEventListener("submit", handleFormSubmit);
    pathRouteSelectEl.addEventListener("change", () => {
      const isNewRoute = pathRouteSelectEl.value === NEW_ROUTE_VALUE;
      pathNewRouteFieldEl.classList.toggle("is-visible", isNewRoute);
      if (isNewRoute) {
        pathNewRouteNameEl.focus();
      } else {
        pathNewRouteNameEl.value = "";
      }
    });
    deletePathButtonEl.addEventListener("click", handleDeletePath);
    mapSearchFormEl?.addEventListener("submit", handleMapSearchSubmit);
    mapSearchClearEl?.addEventListener("click", () => {
      if (mapSearchInputEl) {
        mapSearchInputEl.value = "";
      }
      clearMapSearchResult();
      setStatus("지역 검색 결과를 초기화했습니다.", false);
    });
    startObservationAreaButtonEl?.addEventListener("click", () => {
      if (observationAreaDrawMode) {
        return;
      }
      startObservationAreaDrawMode();
    });
    updateObservationAreaButtonEl?.addEventListener("click", updateSelectedObservationAreaSettings);
    moveObservationAreaButtonEl?.addEventListener("click", toggleObservationAreaMoveMode);
    editObservationAreaButtonEl?.addEventListener("click", toggleObservationAreaEditMode);
    saveObservationAreaButtonEl?.addEventListener("click", saveObservationAreaDraft);
    cancelObservationAreaButtonEl?.addEventListener("click", () => {
      stopObservationAreaDrawMode();
      refreshUI();
      setStatus("관찰 구역 그리기 모드를 취소했습니다.", false);
    });
    observationAreaColorEl?.addEventListener("input", () => {
      if (observationAreaDrawMode || selectedObservationAreaId) {
        renderObservationAreas();
      }
    });
    helpButtonEl?.addEventListener("click", openHelpWindow);
    document.addEventListener("mouseup", finishObservationAreaDrag);
    window.addEventListener("keydown", handleKeydown);
  }

  async function bootstrap() {
    try {
      bindUploadEvents();
      bindFormEvents();
      setCollapsibleSectionExpanded(pointDetailsSectionEl, pointDetailsToggleEl, false);
      setCollapsibleSectionExpanded(pointFormSectionEl, pointFormToggleEl, false);
      setEmptyDetails();
      setEmptyPathDetails();
      clearForm();
      fillPathForm(null);
      restoreWorkspaceFromStorage();
      try {
        await loadRidershipStoreFromServer();
      } catch (error) {
        console.warn(error);
      }
      renderRouteList();
      renderRoutePointList();
      if (!uploadedFileSummaries.length) {
        fileCountEl.textContent = "0";
      }
      updateCounts();

      if (redirectToPreferredOrigin()) {
        return;
      }

      setStatus("카카오맵 SDK를 불러오는 중입니다.", false);
      await loadKakaoMapSdk(config.appKey);
      initMap();
      refreshUI();
      if (uploadedPoints.length || uploadedPaths.length || customPoints.length || customPaths.length || observationAreas.length) {
        setStatus("이전 작업 상태를 복원했습니다.", false);
      }
      setStatus("준비되었습니다. 노선을 선택하고 정류장과 경로를 관리하세요.", false);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  bootstrap();
})();


