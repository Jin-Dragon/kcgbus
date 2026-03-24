const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";
const ROOT = __dirname;
const EXPORTS_DIR = path.join(ROOT, "exports");
const TEMP_EXPORTS_DIR = path.join(os.tmpdir(), "kml-kakao-map-autosaves");
const DEBUG_RENAME_LOG = path.join(ROOT, "rename-debug.log");
const RIDERSHIP_STORE_PATH = path.join(EXPORTS_DIR, "stop-ridership.json");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4";
const KAKAO_MOBILITY_REST_API_KEY = process.env.KAKAO_MOBILITY_REST_API_KEY || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".kml": "application/vnd.google-earth.kml+xml; charset=utf-8",
};

function send(res, statusCode, body, contentType, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    ...extraHeaders,
  });
  res.end(body);
}

function sendJson(res, statusCode, data) {
  send(res, statusCode, JSON.stringify(data), "application/json; charset=utf-8");
}

function parseJsonBody(rawBody) {
  return JSON.parse(rawBody || "{}");
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function ensureDir(targetDir, callback) {
  fs.mkdir(targetDir, { recursive: true }, callback);
}

function readJsonFile(filePath, fallbackValue) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, content) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve(fallbackValue);
          return;
        }
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(content));
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function writeJsonFile(filePath, data) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(filePath), (mkdirError) => {
      if (mkdirError) {
        reject(mkdirError);
        return;
      }

      fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8", (writeError) => {
        if (writeError) {
          reject(writeError);
          return;
        }
        resolve();
      });
    });
  });
}

function normalizeRidershipCount(value) {
  if (value == null || value === "") {
    return null;
  }

  const normalized = Number(String(value).trim().replace(/,/g, ""));
  if (!Number.isFinite(normalized) || normalized < 0) {
    return null;
  }

  return Math.round(normalized);
}

function normalizeRidershipRecord(record) {
  const stopKey = String(record?.stopKey || "").trim();
  if (!stopKey) {
    return null;
  }

  const lat = Number(record?.lat);
  const lng = Number(record?.lng);

  return {
    stopKey,
    routeName: String(record?.routeName || "").trim(),
    stopName: String(record?.stopName || "").trim(),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    boardingCount: normalizeRidershipCount(record?.boardingCount),
    updatedAt: new Date().toISOString(),
  };
}

async function readRidershipStore() {
  const parsed = await readJsonFile(RIDERSHIP_STORE_PATH, { updatedAt: null, records: [] });
  const records = Array.isArray(parsed?.records)
    ? parsed.records.map(normalizeRidershipRecord).filter((record) => record && record.boardingCount != null)
    : [];

  return {
    updatedAt: parsed?.updatedAt || null,
    records,
  };
}

function normalizeDesignRouteOptions(value) {
  const current = value && typeof value === "object" ? value : {};
  const options = {};
  const allowedPriority = ["RECOMMEND", "TIME", "DISTANCE"];
  const allowedAvoid = ["motorway", "toll", "uturn", "schoolzone", "ferries"];

  options.priority = allowedPriority.includes(String(current.priority)) ? String(current.priority) : "RECOMMEND";

  const avoid = Array.isArray(current.avoid)
    ? current.avoid.filter((item, index, array) => allowedAvoid.includes(String(item)) && array.indexOf(item) === index)
    : [];
  if (avoid.length) {
    options.avoid = avoid;
  }

  return options;
}

function saveExportFile(fileName, content, res, successPayloadBuilder, targetDir = EXPORTS_DIR) {
  const requestedFileName = String(fileName || "export.txt");
  const safeFileName = path.basename(requestedFileName).replace(/[^\w.-]/g, "_") || "export.txt";
  const outputPath = path.join(targetDir, safeFileName);

  ensureDir(targetDir, (mkdirError) => {
    if (mkdirError) {
      sendJson(res, 500, { error: "Failed to prepare export directory" });
      return;
    }

    fs.writeFile(outputPath, content, "utf8", (writeError) => {
      if (writeError) {
        sendJson(res, 500, { error: "Failed to write export file" });
        return;
      }

      sendJson(res, 200, successPayloadBuilder(outputPath));
    });
  });
}

function appendDebugLog(payload, res) {
  const line = `${new Date().toISOString()} ${JSON.stringify(payload)}${os.EOL}`;
  fs.appendFile(DEBUG_RENAME_LOG, line, "utf8", (error) => {
    if (error) {
      sendJson(res, 500, { error: "Failed to write debug log" });
      return;
    }
    sendJson(res, 200, { ok: true });
  });
}

async function requestOpenAiAnalysis(payload) {
  if (!OPENAI_API_KEY) {
    return {
      model: null,
      message:
        "OPENAI_API_KEY가 설정되지 않아 로컬 분석 결과만 저장했습니다. 환경변수를 설정하면 GPT 요약과 최적화 제안을 함께 생성합니다.",
    };
  }

  const prompt = [
    "당신은 버스/정류장 노선 데이터 분석가입니다.",
    "입력 데이터에는 노선별 포인트와 경로 좌표, 그리고 로컬 분석 결과가 포함됩니다.",
    "해야 할 일:",
    "1. 반경 30m 내 중복 정류장 후보를 해석한다.",
    "2. 노선 간 경로 중복 구간 후보를 해석한다.",
    "3. 운영상 의미 있는 중복과 단순 근접을 구분한다.",
    "4. 최적화 우선순위를 제안한다.",
    "출력 형식:",
    "- summary: 4문장 이내 요약",
    "- duplicate_stop_insights: 문자열 배열",
    "- overlapping_path_insights: 문자열 배열",
    "- optimization_actions: 문자열 배열",
    "- risks: 문자열 배열",
    "",
    JSON.stringify(payload),
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "route_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              duplicate_stop_insights: {
                type: "array",
                items: { type: "string" },
              },
              overlapping_path_insights: {
                type: "array",
                items: { type: "string" },
              },
              optimization_actions: {
                type: "array",
                items: { type: "string" },
              },
              risks: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "summary",
              "duplicate_stop_insights",
              "overlapping_path_insights",
              "optimization_actions",
              "risks",
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  let parsed = null;

  if (result.output_text) {
    parsed = JSON.parse(result.output_text);
  } else if (Array.isArray(result.output)) {
    for (const item of result.output) {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) {
          parsed = JSON.parse(content.text);
          break;
        }
      }
      if (parsed) {
        break;
      }
    }
  }

  if (!parsed) {
    throw new Error("OpenAI response did not contain parseable analysis output");
  }

  return {
    model: OPENAI_MODEL,
    message: "GPT 분석이 포함되었습니다.",
    analysis: parsed,
  };
}

http
  .createServer((req, res) => {
    const host = req.headers.host || "";

    if (host.startsWith("127.0.0.1:")) {
      res.writeHead(302, {
        Location: `http://localhost:${PORT}${req.url || "/"}`,
      });
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        ok: true,
        port: PORT,
        openAiConfigured: Boolean(OPENAI_API_KEY),
        kakaoMobilityConfigured: Boolean(KAKAO_MOBILITY_REST_API_KEY),
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/save-kml") {
      readRequestBody(req)
        .then((rawBody) => {
          const payload = parseJsonBody(rawBody);
          const requestedFileName = String(payload.fileName || "autosaved-map.kml");
          const safeFileName = path.basename(requestedFileName).replace(/[^\w.-]/g, "_") || "autosaved-map.kml";
          const fileName = safeFileName.toLowerCase().endsWith(".kml") ? safeFileName : `${safeFileName}.kml`;
          const content = String(payload.content || "");
          const targetDir = payload.storage === "temp" ? TEMP_EXPORTS_DIR : EXPORTS_DIR;

          if (!content.trim()) {
            sendJson(res, 400, { error: "Missing KML content" });
            return;
          }

          saveExportFile(fileName, content, res, (outputPath) => ({
                ok: true,
                savedPath: outputPath,
              }), targetDir);
        })
        .catch(() => {
          sendJson(res, 400, { error: "Invalid JSON payload" });
        });
      return;
    }

    if (req.method === "POST" && req.url === "/api/save-analysis") {
      readRequestBody(req)
        .then((rawBody) => {
          const payload = parseJsonBody(rawBody);
          const content = JSON.stringify(payload.report || {}, null, 2);
          saveExportFile("analysis-report.json", content, res, (outputPath) => ({
            ok: true,
            savedPath: outputPath,
          }));
        })
        .catch(() => {
          sendJson(res, 400, { error: "Invalid JSON payload" });
        });
      return;
    }

    if (req.method === "GET" && req.url === "/api/stop-ridership") {
      readRidershipStore()
        .then((store) => {
          sendJson(res, 200, {
            ok: true,
            updatedAt: store.updatedAt,
            records: store.records,
          });
        })
        .catch((error) => {
          sendJson(res, 500, { error: error.message || "Failed to read stop ridership store" });
        });
      return;
    }

    if (req.method === "POST" && req.url === "/api/stop-ridership-import") {
      readRequestBody(req)
        .then(async (rawBody) => {
          const payload = parseJsonBody(rawBody);
          const incomingRecords = Array.isArray(payload.records) ? payload.records : [];
          const parsedRecords = incomingRecords.map(normalizeRidershipRecord).filter(Boolean);
          const existingStore = await readRidershipStore();
          const recordMap = new Map(existingStore.records.map((record) => [record.stopKey, record]));
          let savedCount = 0;
          let clearedCount = 0;

          parsedRecords.forEach((record) => {
            if (record.boardingCount == null) {
              if (recordMap.delete(record.stopKey)) {
                clearedCount += 1;
              }
              return;
            }

            recordMap.set(record.stopKey, record);
            savedCount += 1;
          });

          const nextStore = {
            updatedAt: new Date().toISOString(),
            records: Array.from(recordMap.values()).sort((left, right) =>
              String(left.stopKey).localeCompare(String(right.stopKey), "ko")
            ),
          };

          await writeJsonFile(RIDERSHIP_STORE_PATH, nextStore);
          sendJson(res, 200, {
            ok: true,
            updatedAt: nextStore.updatedAt,
            recordCount: nextStore.records.length,
            savedCount,
            clearedCount,
          });
        })
        .catch((error) => {
          sendJson(res, 400, { error: error.message || "Invalid ridership import payload" });
        });
      return;
    }

    if (req.method === "POST" && req.url === "/api/analyze-routes") {
      readRequestBody(req)
        .then(async (rawBody) => {
          const payload = parseJsonBody(rawBody);
          const dataset = payload.dataset || {};
          const localReport = payload.localReport || {};

          const gptResult = await requestOpenAiAnalysis({
            requested_at: new Date().toISOString(),
            dataset,
            local_report: localReport,
          });

          sendJson(res, 200, {
            ok: true,
            gpt: gptResult.analysis || null,
            model: gptResult.model,
            message: gptResult.message,
          });
        })
        .catch((error) => {
          sendJson(res, 500, { error: error.message || "Analysis request failed" });
        });
      return;
    }

    if (req.method === "POST" && req.url === "/api/design-route") {
      readRequestBody(req)
        .then(async (rawBody) => {
          if (!KAKAO_MOBILITY_REST_API_KEY) {
            sendJson(res, 500, { error: "KAKAO_MOBILITY_REST_API_KEY 환경변수가 설정되지 않았습니다." });
            return;
          }

          const payload = parseJsonBody(rawBody);
          const points = Array.isArray(payload.points) ? payload.points : [];
          const designOptions = normalizeDesignRouteOptions(payload.options);
          const routeName = String(payload.routeName || "설계 노선");

          if (points.length < 2) {
            sendJson(res, 400, { error: "노선 설계를 하려면 포인트가 2개 이상 필요합니다." });
            return;
          }

          const origin = points[0];
          const destination = points[points.length - 1];
          const waypoints = points.slice(1, -1).map((point) => ({
            x: Number(point.lng),
            y: Number(point.lat),
            name: String(point.name || "경유지"),
          }));

          const kakaoResponse = await fetch("https://apis-navi.kakaomobility.com/v1/waypoints/directions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `KakaoAK ${KAKAO_MOBILITY_REST_API_KEY}`,
            },
            body: JSON.stringify({
              origin: {
                x: Number(origin.lng),
                y: Number(origin.lat),
                name: String(origin.name || "출발지"),
              },
              destination: {
                x: Number(destination.lng),
                y: Number(destination.lat),
                name: String(destination.name || "도착지"),
              },
              waypoints,
              summary: false,
              ...designOptions,
            }),
          });

          if (!kakaoResponse.ok) {
            const errorText = await kakaoResponse.text();
            sendJson(res, kakaoResponse.status, {
              error: `카카오 모빌리티 노선 설계 요청 실패: ${errorText}`,
            });
            return;
          }

          const result = await kakaoResponse.json();
          sendJson(res, 200, {
            ok: true,
            routeName,
            options: designOptions,
            routes: result.routes || [],
          });
        })
        .catch((error) => {
          sendJson(res, 500, { error: error.message || "Route design request failed" });
        });
      return;
    }

    if (req.method === "POST" && req.url === "/api/debug-rename-route") {
      readRequestBody(req)
        .then((rawBody) => {
          const payload = parseJsonBody(rawBody);
          appendDebugLog(payload, res);
        })
        .catch(() => {
          sendJson(res, 400, { error: "Invalid JSON payload" });
        });
      return;
    }

    const requestUrl = new URL(req.url || "/", `http://${host || `localhost:${PORT}`}`);
    const urlPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
      send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(res, 404, "Not Found", "text/plain; charset=utf-8");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const cacheHeaders =
        ext === ".html" || ext === ".js" || ext === ".css"
          ? {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            }
          : {};
      send(res, 200, data, contentType, cacheHeaders);
    });
  })
  .listen(PORT, HOST, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
