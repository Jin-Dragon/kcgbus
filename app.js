(function () {
  const CUSTOM_POINTS_KEY = "kml-kakao-map.custom-points";
  const CUSTOM_PATHS_KEY = "kml-kakao-map.custom-paths";
  const OVERRIDES_KEY = "kml-kakao-map.point-overrides";
  const PATH_OVERRIDES_KEY = "kml-kakao-map.path-overrides";
  const ROUTE_SETTINGS_KEY = "kml-kakao-map.route-settings";
  const UPLOADED_POINTS_KEY = "kml-kakao-map.uploaded-points";
  const UPLOADED_PATHS_KEY = "kml-kakao-map.uploaded-paths";
  const UPLOADED_FILE_SUMMARIES_KEY = "kml-kakao-map.uploaded-file-summaries";
  const UI_STATE_KEY = "kml-kakao-map.ui-state";
  const NEW_ROUTE_VALUE = "__new_route__";
  const TEMP_NEW_ROUTE_NAME = "__temp_new_route__";
  const DEFAULT_ROUTE_NAME = "기본 노선";
  const AUTO_SAVE_FILENAME = "autosaved-map.kml";

  const config = window.KAKAO_MAP_CONFIG || {};
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const statusEl = document.getElementById("status");
  const fileCountEl = document.getElementById("file-count");
  const pointCountEl = document.getElementById("point-count");
  const fileListEl = document.getElementById("file-list");
  const saveKmlButtonEl = document.getElementById("save-kml-button");
  const saveResetButtonEl = document.getElementById("save-reset-button");
  const analyzeRoutesButtonEl = document.getElementById("analyze-routes-button");
  const showAllRoutesButtonEl = document.getElementById("show-all-routes-button");
  const hideAllRoutesButtonEl = document.getElementById("hide-all-routes-button");
  const routeListEl = document.getElementById("route-list");
  const routePointListEl = document.getElementById("route-point-list");
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
  const editPointButtonEl = document.getElementById("edit-point-button");
  const finishPathButtonEl = document.getElementById("finish-path-button");
  const cancelPathButtonEl = document.getElementById("cancel-path-button");
  const deletePathButtonEl = document.getElementById("delete-path-button");
  const pathEditorHelpEl = document.getElementById("path-editor-help");
  const analysisModalEl = document.getElementById("analysis-modal");
  const analysisModalBodyEl = document.getElementById("analysis-modal-body");
  const analysisModalCloseEl = document.getElementById("analysis-modal-close");

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
  let selectedPointId = null;
  let selectedPathId = null;
  let mapMouseMoveHandler = null;

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
  let designedRouteInfoWindows = [];
  let latestAnalysisReport = null;

  let uploadedPoints = loadJsonArray(UPLOADED_POINTS_KEY);
  let uploadedPaths = loadJsonArray(UPLOADED_PATHS_KEY);
  let uploadedFileSummaries = loadJsonArray(UPLOADED_FILE_SUMMARIES_KEY);
  let customPoints = loadJsonArray(CUSTOM_POINTS_KEY).map(normalizeCustomPoint);
  let customPaths = loadJsonArray(CUSTOM_PATHS_KEY);
  let pointOverrides = loadJsonObject(OVERRIDES_KEY);
  let pathOverrides = loadJsonObject(PATH_OVERRIDES_KEY);
  let routeSettings = loadJsonObject(ROUTE_SETTINGS_KEY);
  const savedUiState = loadJsonObject(UI_STATE_KEY);
  let workingPathCoordinates = [];
  let autoSaveTimer = null;
  let shouldFitMapToData = true;

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
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

  function openPointDetailsSection() {
    setCollapsibleSectionExpanded(pointDetailsSectionEl, pointDetailsToggleEl, true);
  }

  function openPointFormSection() {
    setCollapsibleSectionExpanded(pointFormSectionEl, pointFormToggleEl, true);
  }

  function setEmptyDetails() {
    pointDetailsEl.classList.add("empty");
    pointDetailsEl.innerHTML = '<p class="details-empty">노선과 포인트를 선택하세요.</p>';
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

  function getRouteSetting(routeName) {
    const normalizedRouteName = normalizeRouteName(routeName);
    const current = routeSettings[normalizedRouteName] || {};
    return {
      color: current.color || colorFromRouteName(normalizedRouteName),
      visible: current.visible !== false,
      deleted: current.deleted === true,
    };
  }

  function ensureRouteSettings() {
    let changed = false;
    getRoutes().forEach((routeName) => {
      if (!routeSettings[routeName]) {
        routeSettings[routeName] = getRouteSetting(routeName);
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
      extendedData: normalizeExtendedData(point.extendedData),
    };
  }

  function normalizeUploadedPoint(point) {
    const override = pointOverrides[point.id] || {};
    return {
      ...point,
      ...override,
      source: "uploaded",
      routeName: normalizeRouteName(override.routeName || point.routeName || point.fileName),
      extendedData: normalizeExtendedData(override.extendedData || point.extendedData),
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

    return [...new Set(routeNames)].sort((a, b) => a.localeCompare(b, "ko"));
  }

  function getPointOrderValue(point) {
    if (point.source === "custom") {
      if (Number.isFinite(Number(point.createdOrder))) {
        return Number(point.createdOrder);
      }
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

  function ensureSelectedPath() {
    if (selectedPathId && !getPathById(selectedPathId)) {
      selectedPathId = null;
    }
  }

  function ensureSelectedRoute() {
    const routes = getRoutes();
    if (!routes.length) {
      selectedRouteName = null;
      return;
    }

    if (!selectedRouteName || !routes.includes(selectedRouteName)) {
      selectedRouteName = routes[0];
    }
  }

  function ensureSelectedPoint() {
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
    pointCountEl.textContent = String(getAllPoints().length);
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

  function formatDistanceKm(distanceMeters) {
    return (Number(distanceMeters || 0) / 1000).toFixed(1);
  }

  function formatDurationMinutes(durationSeconds) {
    return Math.round(Number(durationSeconds || 0) / 60);
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
    const totalDurationSeconds = Number(pathItem?.totalDurationSeconds) || 0;
    return totalDurationSeconds > 0 ? `${formatDurationMinutes(totalDurationSeconds)}분` : "-";
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

  function interpolateCoordinate(start, end, ratio) {
    return {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
  }

  function bearingDegrees(start, end) {
    return (Math.atan2(end.lat - start.lat, end.lng - start.lng) * 180) / Math.PI;
  }

  function buildAnalysisDataset() {
    return {
      routes: getRoutes().map((routeName) => ({
        routeName,
        points: getAllPoints()
          .filter((point) => point.routeName === routeName)
          .map((point) => ({
            id: point.id,
            name: point.name,
            lat: point.lat,
            lng: point.lng,
          })),
        paths: getAllPaths()
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

  function detectDuplicatePoints(thresholdMeters = 30) {
    const points = getAllPoints();
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

  function detectOverlappingSegments(thresholdMeters = 30) {
    const paths = getAllPaths();
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

  function summarizeLocalAnalysis() {
    const duplicatePoints = detectDuplicatePoints(30);
    const overlappingSegments = detectOverlappingSegments(30);

    return {
      analyzedAt: new Date().toISOString(),
      duplicatePointCount: duplicatePoints.length,
      overlappingSegmentCount: overlappingSegments.length,
      duplicatePoints,
      overlappingSegments,
    };
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
    const dataEntries = [
      point.fileName ? `<Data name="fileName"><value>${escapeXml(point.fileName)}</value></Data>` : "",
      point.description ? `<Data name="description"><value>${escapeXml(point.description)}</value></Data>` : "",
    ]
      .concat(
        (point.extendedData || []).map(
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

    return `
      <Placemark>
        <name>${escapeXml(pathItem.name)}</name>
        ${styleId ? `<styleUrl>#${escapeXml(styleId)}</styleUrl>` : ""}
        ${pathItem.description ? `<description>${escapeXml(pathItem.description)}</description>` : ""}
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coordinates}</coordinates>
        </LineString>
      </Placemark>
    `.trim();
  }

  function buildCurrentKml() {
    const routes = getRoutes();
    const points = getAllPoints();
    const paths = getAllPaths();
    const styles = routes.map(buildRouteStyle).filter(Boolean).join("\n");

    const folders = routes
      .map((routeName) => {
        const routePoints = points.filter((point) => point.routeName === routeName);
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

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(AUTO_SAVE_FILENAME)}</name>
    ${styles}
    ${folders}
  </Document>
</kml>`;
  }

  async function saveKmlToServer() {
    const response = await window.fetch("/api/save-kml", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: AUTO_SAVE_FILENAME,
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
    window.localStorage.removeItem(UPLOADED_POINTS_KEY);
    window.localStorage.removeItem(UPLOADED_PATHS_KEY);
    window.localStorage.removeItem(UPLOADED_FILE_SUMMARIES_KEY);
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
    clearDraftMarker();

    uploadedPoints = [];
    uploadedPaths = [];
    uploadedFileSummaries = [];
    customPoints = [];
    customPaths = [];
    pointOverrides = {};
    pathOverrides = {};
    routeSettings = {};
    workingPathCoordinates = [];
    selectedRouteName = null;
    selectedPointId = null;
    selectedPathId = null;
    selectedPathVertexIndex = null;
    shouldFitMapToData = true;
    latestAnalysisReport = null;

    fileInput.value = "";
    fileCountEl.textContent = "0";
    closeAnalysisModal();
    renderFileList([]);
    setEmptyDetails();
    setEmptyPathDetails();
    clearForm();
    fillPathForm(null);
    refreshUI();
  }

  async function handleSaveAndReset() {
    try {
      const savedFileName = await saveKmlWithPicker();
      clearPersistedWorkspace();
      resetWorkspaceState();
      setStatus(`${savedFileName} ??ν썑 ?깃났?곸쑝濡?珥덇린?뷀뻽?듬땲??`, false);
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("KML ??μ쓣 痍⑥냼?덉뒿?덈떎.", false);
        return;
      }

      setStatus(error.message || "KML ??μ쓣 ?섑뻾?섏? 紐삵뻽?듬땲??", true);
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

  function renderAnalysisOverlays(report) {
    clearAnalysisOverlays();
    if (!mapReady || !report) {
      return;
    }

    report.duplicatePoints.forEach((item) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(item.center.lat, item.center.lng),
        title: `중복 포인트 후보 ${item.distanceMeters}m`,
        image: createMarkerImage("#dc2626", true),
      });
      analysisMarkers.push(marker);
    });

    report.overlappingSegments.forEach((item) => {
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: item.coordinates.map((coordinate) => new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng)),
        strokeWeight: 8,
        strokeColor: "#dc2626",
        strokeOpacity: 0.8,
        strokeStyle: "shortdash",
        endArrow: true,
      });
      analysisPolylines.push(polyline);
    });
  }

  function renderAnalysisRangeOverlays(report) {
    clearAnalysisOverlays();
    if (!mapReady || !report) {
      return;
    }

    report.duplicatePoints.forEach((item) => {
      const center = new window.kakao.maps.LatLng(item.center.lat, item.center.lng);
      const groupLines = item.points
        .map((point) => `${escapeHtml(point.routeName)} / ${escapeHtml(point.name)}`)
        .join("<br>");
      const circle = new window.kakao.maps.Circle({
        map,
        center,
        radius: 30,
        strokeWeight: 2,
        strokeColor: "#dc2626",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        fillColor: "#fecaca",
        fillOpacity: 0.28,
      });
      const marker = new window.kakao.maps.Marker({
        map,
        position: center,
        title: `중복 포인트 범위 ${item.distanceMeters}m`,
        image: createMarkerImage("#dc2626", true),
      });
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="display:inline-block;padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
            <strong>중복 포인트 후보</strong><br>
            ${escapeHtml(item.points[0].routeName)} / ${escapeHtml(item.points[0].name)}<br>
            ${escapeHtml(item.points[1].routeName)} / ${escapeHtml(item.points[1].name)}<br>
            거리: ${escapeHtml(String(item.distanceMeters))}m
          </div>
        `,
      });
      infoWindow.setContent(`
        <div style="display:inline-block;padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
          <strong>중복 포인트 그룹</strong><br>
          ${groupLines}<br>
          거리: ${escapeHtml(String(item.distanceMeters))}m<br>
          포인트 수: ${escapeHtml(String(item.points.length))}개
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

    report.overlappingSegments.forEach((item) => {
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: item.coordinates.map((coordinate) => new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng)),
        strokeWeight: 8,
        strokeColor: "#dc2626",
        strokeOpacity: 0.8,
        strokeStyle: "shortdash",
        endArrow: true,
      });
      analysisPolylines.push(polyline);
    });
  }

  function buildLocalOptimizationActions(localReport) {
    const actions = [];

    if (localReport.duplicatePointCount > 0) {
      actions.push(`반경 30m 내 중복 포인트 ${localReport.duplicatePointCount}건을 우선 검토하세요.`);
    }
    if (localReport.overlappingSegmentCount > 0) {
      actions.push(`노선 간 겹치는 경로 구간 ${localReport.overlappingSegmentCount}건을 통합 가능 구간으로 검토하세요.`);
    }
    if (!actions.length) {
      actions.push("현재 기준에서는 뚜렷한 중복 포인트나 중복 구간이 없습니다.");
    }

    return actions;
  }

  function buildLocalRiskNotes(localReport) {
    const risks = [];

    if (localReport.duplicatePointCount > 0) {
      risks.push("근접 포인트는 실제 같은 정류장일 수도 있고, 상하행 분리 정류장일 수도 있습니다.");
    }
    if (localReport.overlappingSegmentCount > 0) {
      risks.push("중복 경로 구간은 공용 도로 구간일 수 있으므로 운영 의미를 함께 검토해야 합니다.");
    }
    if (!risks.length) {
      risks.push("현재 분석 기준에서는 추가 위험 신호가 확인되지 않았습니다.");
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
          <span>중복 포인트</span>
          <strong>${escapeHtml(String(report.local.duplicatePointCount))}건</strong>
        </div>
        <div class="analysis-stat">
          <span>중복 경로 구간</span>
          <strong>${escapeHtml(String(report.local.overlappingSegmentCount))}건</strong>
        </div>
      </div>
      <div class="analysis-list-card">
        <h3>GPT 요약</h3>
        <p>${escapeHtml(gpt.summary || report.message || "로컬 분석 결과만 생성되었습니다.")}</p>
      </div>
      <div class="analysis-list-card">
        <h3>중복 포인트 리스트</h3>
        <ul>${duplicateItems || "<li>중복 포인트가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 구간 리스트</h3>
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
          `<li>${escapeHtml(item.points[0].name)} / ${escapeHtml(item.points[1].name)} 가 ${escapeHtml(
            String(item.distanceMeters)
          )}m 이내에 있습니다.</li>`
      )
      .join("");
    const duplicateItemsGrouped = report.local.duplicatePoints
      .slice(0, 20)
      .map(
        (item) =>
          `<li>${escapeHtml(duplicateGroupLabel(item))} (${escapeHtml(String(item.distanceMeters))}m, ${escapeHtml(
            String(item.points.length)
          )}개 포인트)</li>`
      )
      .join("");
    const duplicateInsightsGrouped = report.local.duplicatePoints
      .slice(0, 10)
      .map(
        (item) => `<li>${escapeHtml(duplicateGroupLabel(item))} 가 ${escapeHtml(String(item.distanceMeters))}m 이내 중복 그룹입니다.</li>`
      )
      .join("");
    const overlapInsights = report.local.overlappingSegments
      .slice(0, 10)
      .map(
        (item) =>
          `<li>${escapeHtml(item.routeNames[0])} 와 ${escapeHtml(item.routeNames[1])} 사이에 약 ${escapeHtml(
            String(item.averageLengthMeters)
          )}m 중복 구간 후보가 있습니다.</li>`
      )
      .join("");
    const actionItems = localActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const riskItems = localRisks.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    analysisModalBodyEl.innerHTML = `
      <div class="analysis-grid">
        <div class="analysis-stat">
          <span>중복 포인트</span>
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
        <h3>중복 포인트 리스트</h3>
        <ul>${duplicateItems || "<li>중복 포인트가 없습니다.</li>"}</ul>
      </div>
      <div class="analysis-list-card">
        <h3>중복 경로 구간 리스트</h3>
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
      throw new Error("analysis-report.json 저장에 실패했습니다.");
    }

    return response.json();
  }

  async function requestDesignedRoute(routeName, points) {
    const response = await window.fetch("/api/design-route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routeName,
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
      throw new Error(payload.error || "노선 설계 요청에 실패했습니다.");
    }

    return response.json();
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

  function extractDesignedRouteCoordinates(payload) {
    const coordinates = [];
    (payload.routes || []).forEach((route) => {
      (route.sections || []).forEach((section) => {
        (section.roads || []).forEach((road) => {
          coordinates.push(...convertVertexesToCoordinates(road.vertexes || []));
        });
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

  function buildPointSequenceCoordinates(points) {
    return points
      .map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
        altitude: null,
      }))
      .filter((coordinate) => Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng));
  }

  function extractDesignedRouteSummary(payload) {
    const summary = payload?.routes?.[0]?.summary || {};
    return {
      totalDistanceMeters: Number(summary.distance) || 0,
      totalDurationSeconds: Number(summary.duration) || 0,
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

    designRouteButtonEl.disabled = true;
    setStatus(`"${selectedRouteName}" \uB178\uC120 \uC124\uACC4\uB97C \uC2DC\uC791\uD569\uB2C8\uB2E4. \uCCAB \uD3EC\uC778\uD2B8\uBD80\uD130 \uB9C8\uC9C0\uB9C9 \uD3EC\uC778\uD2B8 \uC21C\uC11C\uB85C \uACBD\uB85C\uB97C \uACC4\uC0B0\uD569\uB2C8\uB2E4.`, false);

    try {
      const result = await requestDesignedRoute(selectedRouteName, routePoints);
      let coordinates = extractDesignedRouteCoordinates(result);
      let usedFallback = false;
      const summary = extractDesignedRouteSummary(result);

      if (coordinates.length < 2) {
        coordinates = buildPointSequenceCoordinates(routePoints);
        usedFallback = true;
      }

      if (coordinates.length < 2) {
        throw new Error("\uC124\uACC4 \uACB0\uACFC\uC5D0\uC11C \uACBD\uB85C \uC88C\uD45C\uB97C \uCDA9\uBD84\uD788 \uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      }

      customPaths = customPaths.filter(
        (pathItem) => !(pathItem.routeName === selectedRouteName && pathItem.designedRoute === true)
      );

      const designedPath = {
        id: `designed-route-${selectedRouteName}-${Date.now()}` ,
        source: "custom-path",
        routeName: selectedRouteName,
        fileName: "\uB178\uC120 \uC124\uACC4",
        name: `${selectedRouteName} \uC124\uACC4 \uB178\uC120`,
        description: usedFallback
          ? "\uD3EC\uC778\uD2B8 \uC21C\uC11C\uB97C \uAE30\uC900\uC73C\uB85C \uC9C1\uC120 \uC5F0\uACB0\uD55C \uC124\uACC4 \uB178\uC120"
          : "\uCE74\uCE74\uC624\uBAA8\uBE4C\uB9AC\uD2F0 \uC124\uACC4 \uACB0\uACFC\uB97C \uBC18\uC601\uD55C \uB178\uC120",
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

      setStatus(
        usedFallback
          ? `"${selectedRouteName}" \uC124\uACC4 \uB178\uC120\uC744 \uD3EC\uC778\uD2B8 \uC21C\uC11C\uB300\uB85C \uADF8\uB838\uC2B5\uB2C8\uB2E4.`
          : `"${selectedRouteName}" \uC124\uACC4 \uB178\uC120\uC744 \uADF8\uB838\uC2B5\uB2C8\uB2E4.` ,
        false
      );
    } catch (error) {
      setStatus(error.message || "\uB178\uC120 \uC124\uACC4 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", true);
    } finally {
      designRouteButtonEl.disabled = false;
    }
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
        message: `노선 ${dataset.routes.length}개, 포인트 ${pointCount}개, 경로 ${pathCount}개를 기준으로 로컬 분석을 완료했습니다.`,
      };

      latestAnalysisReport = report;
      renderAnalysisRangeOverlays(localReport);
      renderLocalAnalysisModal(report);
      await saveAnalysisReport(report);
      setStatus("노선 로컬 분석을 완료했고 analysis-report.json으로 저장했습니다.", false);
    } catch (error) {
      setStatus(error.message || "노선 로컬 분석 중 오류가 발생했습니다.", true);
    } finally {
      analyzeRoutesButtonEl.disabled = false;
    }
  }

  function scheduleAutoSaveKml() {
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = window.setTimeout(async () => {
      autoSaveTimer = null;
      try {
        const result = await saveKmlToServer();
        if (result?.savedPath) {
          setStatus(`수정 내용이 ${result.savedPath} 에 자동 저장되었습니다.`, false);
        }
      } catch (error) {
        setStatus(error.message, true);
      }
    }, 300);
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
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
      script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
      script.onerror = () =>
        reject(
          new Error(
            `카카오맵 SDK를 불러오지 못했습니다. 현재 접속 주소 ${window.location.origin} 이 카카오 Developers의 JavaScript SDK 도메인에 등록되어 있고, 카카오맵 사용 설정이 ON인지 확인하세요.`
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
    mapReady = true;
    window.kakao.maps.event.addListener(map, "click", handleMapClick);
  }

  function clearMap() {
    markers.forEach((item) => item.marker.setMap(null));
    infoWindows.forEach((item) => item.close());
    polylines.forEach((item) => item.polyline.setMap(null));
    directionOverlays.forEach((item) => item.setMap(null));
    clearAnalysisOverlays();
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
      extendedData: getExtendedData(placemark),
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

    return {
      id: `${fileName}-path-${index}`,
      source: "uploaded-path",
      routeName: normalizeRouteName(routeName || fileName),
      fileName,
      name: directChildText(placemark, "name") || normalizeRouteName(routeName || fileName),
      description: directChildText(placemark, "description"),
      styleUrl: directChildText(placemark, "styleUrl"),
      rawCoordinates,
      coordinates,
    };
  }

  function parseKml(text, filename) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.getElementsByTagName("parsererror")[0]) {
      throw new Error(`${filename}: KML 파싱 실패`);
    }

    let pointIndex = 0;
    let pathIndex = 0;
    const points = [];
    const paths = [];

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
    return { points, paths };
  }

  function renderFileList(filesSummary) {
    fileListEl.innerHTML = "";
    filesSummary.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `${escapeHtml(item.name)}<small>${item.pointCount}개 포인트 / ${item.pathCount}개 경로</small>`;
      fileListEl.appendChild(li);
    });
  }

  function renderRouteList() {
    routeListEl.innerHTML = "";
    const routes = getRoutes();

    if (!routes.length) {
      routeListEl.innerHTML = '<div class="details-card empty"><p class="details-empty">노선이 없습니다.</p></div>';
      return;
    }

    routes.forEach((routeName) => {
      const setting = getRouteSetting(routeName);
      const row = document.createElement("div");
      row.className = "route-row";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-button";
      button.style.borderLeft = `6px solid ${setting.color}`;
      if (routeName === selectedRouteName) {
        button.classList.add("is-selected");
      }

      const pointCount = getAllPoints().filter((point) => point.routeName === routeName).length;
      const pathCount = getAllPaths().filter((path) => path.routeName === routeName).length;
      const hasDesignedRoute = getAllPaths().some(
        (pathItem) => pathItem.routeName === routeName && pathItem.designedRoute === true
      );
      button.innerHTML = `
        <strong>
          ${escapeHtml(routeName)}
          ${hasDesignedRoute ? '<span class="route-badge">설계</span>' : ""}
        </strong>
        <span>${pointCount}개 포인트 / ${pathCount}개 경로</span>
      `;
      button.addEventListener("click", () => {
        stopPathModes();
        selectedRouteName = routeName;
        selectedPointId = null;
        selectedPathId = null;
        ensureSelectedPoint();
        stopRelocateMode();
        refreshUI();
      });

      const controls = document.createElement("div");
      controls.className = "route-controls";

      const visibleLabel = document.createElement("label");
      visibleLabel.className = "route-toggle";
      const visibleInput = document.createElement("input");
      visibleInput.type = "checkbox";
      visibleInput.checked = setting.visible;
      visibleInput.addEventListener("change", (event) => {
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

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "route-color-input";
      colorInput.value = setting.color;
      colorInput.title = `${routeName} 색상`;
      colorInput.addEventListener("input", (event) => {
        routeSettings[routeName] = {
          ...getRouteSetting(routeName),
          color: event.target.value,
        };
        saveRouteSettings();
        refreshUI();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "route-delete-button";
      deleteButton.textContent = "삭제";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handleDeleteRoute(routeName);
      });

      controls.appendChild(visibleLabel);
      controls.appendChild(colorInput);
      controls.appendChild(deleteButton);
      row.appendChild(button);
      row.appendChild(controls);
      routeListEl.appendChild(row);
    });
  }

  function setAllRoutesVisible(visible) {
    const routes = getRoutes();
    if (!routes.length) {
      setStatus("표시를 바꿀 노선이 없습니다.", true);
      return;
    }

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

  function renderRoutePointList() {
    routePointListEl.innerHTML = "";
    const points = getPointsInSelectedRoute();

    if (!selectedRouteName) {
      routePointListEl.innerHTML = '<div class="details-card empty"><p class="details-empty">노선을 먼저 선택하세요.</p></div>';
      return;
    }

    if (!points.length) {
      routePointListEl.innerHTML = '<div class="details-card empty"><p class="details-empty">이 노선에는 포인트가 없습니다.</p></div>';
      return;
    }

    points.forEach((point, index) => {
      const setting = getRouteSetting(point.routeName);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "point-item";
      button.style.borderLeft = `6px solid ${setting.color}`;
      if (point.id === selectedPointId) {
        button.classList.add("is-selected");
      }
      button.innerHTML = `<strong>${index + 1}. ${escapeHtml(point.name)}</strong><span>${point.lat}, ${point.lng}</span>`;
      button.addEventListener("click", () => selectPointById(point.id));
      routePointListEl.appendChild(button);
    });
  }

  function restoreWorkspaceFromStorage() {
    if (!uploadedPoints.length && !uploadedPaths.length && !customPoints.length && !customPaths.length) {
      return;
    }

    fileCountEl.textContent = String(uploadedFileSummaries.length);
    renderFileList(uploadedFileSummaries);
    selectedRouteName = typeof savedUiState.selectedRouteName === "string" ? savedUiState.selectedRouteName : null;
    selectedPointId = typeof savedUiState.selectedPointId === "string" ? savedUiState.selectedPointId : null;
    selectedPathId = typeof savedUiState.selectedPathId === "string" ? savedUiState.selectedPathId : null;
    shouldFitMapToData = false;
  }

  function renderMoveRouteOptions() {
    const routes = getRoutes();
    moveRouteSelectEl.innerHTML = "";

    if (!selectedPointId || routes.length < 2) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = routes.length < 2 ? "이동 가능한 노선 없음" : "포인트를 선택하세요";
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
    newOption.textContent = "신규 노선 추가";
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
    newOption.textContent = "신규 노선 추가";
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

  function createMarkerImage(color, isSelected) {
    const size = isSelected ? 26 : 22;
    const stroke = isSelected ? "#1f1a14" : "#ffffff";
    const strokeWidth = isSelected ? 3 : 2;
    const radius = isSelected ? 9 : 8;
    const center = size / 2;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" />
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

  function showPathContextMenu(position, onExtend, onDelete) {
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

    const extendButton = document.createElement("button");
    extendButton.type = "button";
    extendButton.className = "path-context-button";
    extendButton.textContent = "경로 연장";
    extendButton.addEventListener("click", (event) => {
      stopMenuEvent(event);
      hidePathContextMenu();
      onExtend();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "path-context-button danger";
    deleteButton.textContent = "경로 삭제";
    deleteButton.addEventListener("click", (event) => {
      stopMenuEvent(event);
      hidePathContextMenu();
      onDelete();
    });

    wrapper.appendChild(extendButton);
    wrapper.appendChild(deleteButton);

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
        if (isLast && pathExtendMode) {
          handlePathFormSubmit();
          return;
        }

        selectedPathVertexIndex = index;
        pathExtendMode = false;
        syncPathPreview();
        updatePathEditorUi();
        setStatus("점이 선택되었습니다. 지도에서 새 위치를 클릭하면 선이 함께 이동합니다.", false);
      });

      window.kakao.maps.event.addListener(marker, "rightclick", () => {
        if (!isLast) {
          return;
        }

        showPathContextMenu(
          marker.getPosition(),
          () => {
            pathExtendMode = true;
            updatePathEditorUi();
            setStatus("선 연장 모드입니다. 지도에서 새 끝점을 클릭하세요.", false);
          },
          () => {
            if (workingPathCoordinates.length <= 2) {
              setStatus("경로는 최소 2개 좌표가 필요합니다.", true);
              return;
            }
            workingPathCoordinates = workingPathCoordinates.slice(0, -1);
            pathExtendMode = false;
            syncPathPreview();
            updatePathEditorUi();
            setStatus("마지막 선 구간을 삭제했습니다.", false);
          }
        );
      });

      pathVertexMarkers.push(marker);
    });
  }

  function updatePathEditorUi() {
    const hasSelectedPath = Boolean(getPathById(selectedPathId));
    const drawing = drawPathMode;
    const editing = editPathMode;
    const pathEditingActive = drawing || editing;

    startPathDrawButtonEl.classList.toggle("is-active", drawing);
    startPathEditButtonEl.classList.toggle("is-active", editing);
    finishPathButtonEl.disabled = !(drawing || editing) || workingPathCoordinates.length < 2;
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
      pathEditorHelpEl.textContent = "지도 클릭으로 꼭짓점을 추가합니다. 저장을 누르면 현재 노선에 새 경로가 생성됩니다.";
    } else if (editing) {
      pathEditorHelpEl.textContent = "중간 점은 드래그로 이동합니다. 시작점은 초록색, 끝점은 빨간색입니다. 마지막 점 우클릭 후 extend 또는 delete 를 선택하세요.";
    } else {
      pathEditorHelpEl.textContent = "노선을 선택한 뒤 새 경로를 그리고, 기존 경로는 편집 모드에서 꼭짓점을 드래그해 수정합니다.";
    }
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
    setStatus(`새 경로 그리기 모드입니다. 현재 노선은 ${selectedRouteName} 입니다. 지도에서 점을 클릭하세요.`, false);
  }

  function startPathEditMode() {
    const selectedPath = getPathById(selectedPathId);
    if (!selectedPath) {
      setStatus("편집할 경로를 먼저 선택하세요.", true);
      return;
    }

    stopRelocateMode();
    selectedPointId = null;
    drawPathMode = false;
    editPathMode = true;
    pathExtendMode = false;
    selectedPathVertexIndex = null;
    workingPathCoordinates = selectedPath.coordinates.map((coordinate) => ({ ...coordinate }));
    fillPathForm(selectedPath);
    updatePathEditorUi();
    syncPathPreview();
    setStatus("경로 편집 모드입니다. 꼭짓점을 드래그해 수정하세요.", false);
  }

  function renderPointDetails(point) {
    if (!point) {
      setEmptyDetails();
      return;
    }

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
    ].filter((row) => row.value);

    const extendedRows = (point.extendedData || [])
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
    setStatus("포인트 수정 모드입니다. 수정할 위치를 클릭하세요. 취소는 Esc 입니다.", false);
  }
  function setAddPointMode(enabled) {
    addPointMode = enabled;
    if (enabled) {
      if (!selectedRouteName) {
        selectedRouteName = TEMP_NEW_ROUTE_NAME;
      }
      stopRelocateMode();
      renderFormRouteOptions(selectedRouteName || "");
    }

    updatePointModeButtons();

    if (enabled) {
      setStatus(
        selectedRouteName
          ? `포인트 추가 모드입니다. 현재 노선은 ${selectedRouteName === TEMP_NEW_ROUTE_NAME ? "신규 노선" : selectedRouteName} 입니다. 지도에서 위치를 클릭하세요.`
          : "포인트 추가 모드입니다. 먼저 노선을 입력한 뒤 지도에서 위치를 클릭하세요.",
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
      setStatus("경로 편집 중에는 포인트 수정 모드를 사용할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    if (!point) {
      setStatus("수정할 포인트를 먼저 선택하세요.", true);
      return;
    }

    openPointFormSection();
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
          closeModes: false,
          successMessage: () => "선택한 점 위치를 이동했고, 연결 선 중간에 새 편집점을 추가한 뒤 자동 저장했습니다.",
        });
        return;
      }

      if (editPathMode && !pathExtendMode) {
        setStatus("경로 편집 중에는 점을 먼저 선택한 뒤 지도에서 새 위치를 클릭하세요. 선 연장은 마지막 점 우클릭 후 경로 연장을 선택하면 됩니다.", true);
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
          ? `경로 점 ${workingPathCoordinates.length}개를 추가했습니다. 저장하려면 경로 저장을 누르세요.`
          : `경로 끝점이 추가되었습니다. 계속 연장할 수 있으며, 마지막 빨간 점을 다시 클릭하면 저장합니다.`,
        false
      );
      return;
    }

    if (relocatePointId) {
      relocatePointToPosition(lat, lng);
      return;
    }

    if (!addPointMode) {
      return;
    }

    clearForm(lat, lng);
    renderFormRouteOptions(selectedRouteName);
    ensureDraftMarker(lat, lng);
    formEls.name.focus();
    setStatus(`새 포인트 위치를 선택했습니다. 노선은 ${selectedRouteName} 입니다.`, false);
  }

  function selectPoint(point, marker, infoWindow) {
    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 포인트를 수정할 수 없습니다.", true);
      return;
    }

    stopPathModes();
    stopRelocateMode();
    selectedRouteName = point.routeName;
    selectedPointId = point.id;
    selectedPathId = null;
    renderPointDetails(point);
    fillForm(point);
    renderRouteList();
    renderRoutePointList();

    infoWindows.forEach((item) => item.close());
    if (marker && infoWindow && mapReady) {
      infoWindow.open(map, marker);
      map.panTo(marker.getPosition());
    }
    setStatus(`포인트 "${point.name}" 를 선택했습니다. 필요하면 포인트 수정 모드를 누르세요.`, false);
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
    selectedRouteName = pathItem.routeName;
    selectedPointId = null;
    selectedPathId = pathItem.id;
    fillPathForm(pathItem);
    refreshUI();
    setStatus(`${pathItem.routeName} 경로를 선택했습니다.`, false);
  }

  function showPathInfo(pathItem, position) {
    designedRouteInfoWindows.forEach((item) => item.close());
    designedRouteInfoWindows = [];

    const totalDistanceMeters = Number(pathItem.totalDistanceMeters) || calculatePathDistanceMeters(pathItem);

    const infoWindow = new window.kakao.maps.InfoWindow({
      position,
      removable: false,
      content: `
        <div style="padding:8px 10px;font-size:12px;line-height:1.5;white-space:nowrap;">
          <strong>${escapeHtml(pathItem.name || "\uACBD\uB85C")}</strong><br>
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
      const isSelected = !selectedRouteName || pathItem.routeName === selectedRouteName;
      const designedStrokeWeight = pathItem.designedRoute ? 10 : null;
      const designedOutline = pathItem.designedRoute
        ? new window.kakao.maps.Polyline({
            map,
            path: polylinePath,
            strokeWeight: 16,
            strokeColor: "#fff8e8",
            strokeOpacity: 0.96,
            strokeStyle: "solid",
            clickable: false,
            endArrow: false,
          })
        : null;
      const polyline = new window.kakao.maps.Polyline({
        map,
        path: polylinePath,
        strokeWeight: designedStrokeWeight || (pathItem.id === selectedPathId ? 7 : isSelected ? 5 : 3),
        strokeColor: pathItem.designedRoute ? "#c2410c" : routeSetting.color,
        strokeOpacity: pathItem.designedRoute ? 0.98 : pathItem.id === selectedPathId ? 1 : isSelected ? 0.92 : 0.5,
        strokeStyle: pathItem.designedRoute ? "shortdash" : "solid",
        clickable: true,
        endArrow: true,
      });

      window.kakao.maps.event.addListener(polyline, "click", (mouseEvent) => {
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
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        title: point.name,
        image: createMarkerImage(routeSetting.color, point.id === selectedPointId),
      });

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;">${escapeHtml(point.name)}</div>`,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (relocatePointId) {
          relocatePointToPosition(point.lat, point.lng);
          return;
        }
        selectPoint(point, marker, infoWindow);
      });

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
    ensureSelectedPoint();
    ensureSelectedPath();
    updatePointModeButtons();
    updateCounts();
    renderRouteList();
    renderRoutePointList();
    renderMoveRouteOptions();
    renderPoints();
    renderPointDetails(getPointById(selectedPointId));
    fillForm(getPointById(selectedPointId));
    renderPathDetails(getPathById(selectedPathId));
    fillPathForm(getPathById(selectedPathId));
    updatePathEditorUi();
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
      setStatus("경로 편집 중에는 포인트를 삭제할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    if (!point) {
      setStatus("삭제할 포인트를 먼저 선택하세요.", true);
      return;
    }

    const confirmed = window.confirm(`포인트 "${point.name}" 을(를) 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

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
    selectedPointId = null;
    refreshUI();
    setStatus(`포인트 "${point.name}" 을(를) 삭제했습니다.`, false);
  }

  function handleDeleteRoute(routeName) {
    const normalizedRouteName = normalizeRouteName(routeName);
    const routePointCount = getAllPoints().filter((point) => point.routeName === normalizedRouteName).length;
    const routePathCount = getAllPaths().filter((path) => path.routeName === normalizedRouteName).length;
    const confirmed = window.confirm(
      `노선 "${normalizedRouteName}" 과 하위 포인트 ${routePointCount}개, 경로 ${routePathCount}개를 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

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
    setStatus(`노선 "${normalizedRouteName}" 을(를) 삭제했습니다.`, false);
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
      setStatus("경로 편집 중에는 포인트를 이동할 수 없습니다.", true);
      return;
    }

    const point = getPointById(selectedPointId);
    const targetRouteName = normalizeRouteName(moveRouteSelectEl.value);

    if (!point) {
      setStatus("이동할 포인트를 먼저 선택하세요.", true);
      return;
    }

    if (!moveRouteSelectEl.value) {
      setStatus("이동할 노선을 선택하세요.", true);
      return;
    }

    movePointToRoute(point.id, targetRouteName);
    selectedRouteName = targetRouteName;
    selectedPointId = point.id;
    stopRelocateMode();
    refreshUI();
    setStatus(`포인트를 ${targetRouteName} 노선으로 이동했습니다.`, false);
  }

  function persistWorkingPath(options = {}) {
    const { closeModes = false, successMessage } = options;

    if (workingPathCoordinates.length < 2) {
      throw new Error("경로는 최소 2개 좌표가 필요합니다.");
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
      const updatedPath = persistWorkingPath({
        closeModes: true,
        successMessage: (pathItem) => `경로 "${pathItem.name}" 을(를) 저장했습니다.`,
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

    const confirmed = window.confirm(`경로 "${selectedPath.name}" 을(를) 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

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
    setStatus(`경로 "${selectedPath.name}" 을(를) 삭제했습니다.`, false);
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
      extendedData: normalizeExtendedData(basePoint.extendedData),
    };
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (drawPathMode || editPathMode) {
      setStatus("경로 편집 중에는 포인트를 저장할 수 없습니다.", true);
      return;
    }

    try {
      const selectedPoint = getPointById(selectedPointId);

      if (selectedPoint && selectedPoint.source === "custom") {
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
        if (!selectedRouteName) {
          throw new Error("새 포인트를 만들기 전에 노선을 먼저 선택하세요.");
        }

        const lat = Number(formEls.lat.value);
        const lng = Number(formEls.lng.value);
        const point = buildPointFromForm(createCustomPoint(lat, lng));
        customPoints = [...customPoints, point];
        saveCustomPoints();
        selectedPointId = point.id;
        selectedRouteName = point.routeName;
      }

      stopRelocateMode();
      setAddPointMode(false);
      refreshUI();
      setStatus("포인트를 저장했습니다.", false);
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

    for (const file of files) {
      const text = await file.text();
      const parsed = parseKml(text, file.name);
      fileSummaries.push({
        name: file.name,
        pointCount: parsed.points.length,
        pathCount: parsed.paths.length,
      });
      points.push(...parsed.points);
      paths.push(...parsed.paths);
    }

    uploadedPoints = points;
    uploadedPaths = paths;
    uploadedFileSummaries = fileSummaries;
    saveUploadedWorkspace();
    shouldFitMapToData = true;
    fileCountEl.textContent = String(files.length);
    renderFileList(fileSummaries);
    stopPathModes();
    stopRelocateMode();
    selectedRouteName = points[0]?.routeName || paths[0]?.routeName || selectedRouteName;
    selectedPointId = null;
    selectedPathId = null;
    refreshUI();
    setStatus("포인트와 경로를 지도에 표시했습니다.", false);
  }

  function handleKeydown(event) {
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
      setStatus("포인트 수정 모드를 취소했습니다.", false);
      return;
    }

    if (addPointMode) {
      setAddPointMode(false);
      clearDraftMarker();
      setStatus("포인트 추가 모드를 취소했습니다.", false);
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
  }

  function bindFormEvents() {
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
        setStatus("경로 편집 중에는 포인트 추가 모드를 사용할 수 없습니다.", true);
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
        setStatus("포인트 수정 모드를 종료했습니다.", false);
        return;
      }
      handleStartPointEditMode();
    });

    resetPointButtonEl.addEventListener("click", () => {
      if (drawPathMode || editPathMode) {
        setStatus("경로 편집 중에는 새 포인트를 만들 수 없습니다.", true);
        return;
      }

      if (!selectedRouteName) {
        setStatus("새 포인트를 만들기 전에 노선을 먼저 선택하세요.", true);
        return;
      }

      selectedPointId = null;
      stopRelocateMode();
      clearForm();
      renderFormRouteOptions(selectedRouteName);
      setAddPointMode(true);
      openPointFormSection();
      setStatus(`새 포인트를 입력하세요. 현재 노선은 ${selectedRouteName} 입니다.`, false);
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
    resetDesignedRouteButtonEl.addEventListener("click", handleResetDesignedRoute);
    showAllRoutesButtonEl.addEventListener("click", () => setAllRoutesVisible(true));
    hideAllRoutesButtonEl.addEventListener("click", () => setAllRoutesVisible(false));
    finishPathButtonEl.addEventListener("click", handlePathFormSubmit);
    cancelPathButtonEl.addEventListener("click", () => {
      stopPathModes();
      refreshUI();
      setStatus("경로 편집 모드를 취소했습니다.", false);
    });
    saveKmlButtonEl.addEventListener("click", handleSaveKml);
    saveResetButtonEl.addEventListener("click", handleSaveAndReset);
    analyzeRoutesButtonEl.addEventListener("click", handleAnalyzeRoutesLocal);
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
      if (uploadedPoints.length || uploadedPaths.length || customPoints.length || customPaths.length) {
        setStatus("이전 작업 상태를 복원했습니다.", false);
      }
      setStatus("준비되었습니다. 노선을 선택하고 포인트와 경로를 관리하세요.", false);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  bootstrap();
})();
