# Session Notes

- Primary project source: `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map`
- Deploy target: `C:\Users\wls29\Desktop\kcgbus-render`
- Main app: Kakao-based KML editor and analytics UI; deploy repo tracks `main` on `https://github.com/Jin-Dragon/kcgbus`.
- Current branch: `main`, clean relative to `origin/main` (no pending changes at the time of writing).

## 2026-03-23 Data Digitization Focus

- Working from the `hyodo_date/month` PDFs to manually transcribe 효도버스 passenger counts into Excel, beginning with 5호차 and continuing through every route/date until the dataset is complete.
- Each Excel sheet must mimic the reference `ex1.xlsx` layout, group rows as `노선 - 정류장(탑승인원)`, aggregate counts by date (ignore the time-of-day breakdown), and include only the verified passenger count in the `source_preview` column.
- Data extraction is done purely by visually reading the table images inside the PDFs; ambiguous figures should be skipped rather than inferring patterns.
- This passenger data will later feed into the route comparison dashboard, stop-level hide/show controls, and help text updates so the UI can reference real ridership figures.
- The local server at `http://localhost:8080` will be fired up once the updated Excel files are ready, allowing the new passenger inputs to be reviewed in the browser.

## Next Resume Prompt (Data Digitization)

Use this next time:

```text
다음 파일 이어서 시작 — hyodo_date/month의 PDF를 하나씩 열어 5호차부터 이어가며 승객 수 데이터를 직접 표로 옮겨서 날짜별/정류장별 Excel 시트를 완성하고 검토까지 마친 뒤 다음 파일을 진행합니다.
```

## 2026-03-25 Ridership CSV Update

- Deploy source was updated from:
  - `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map`
- Added stop ridership CSV workflow to the app:
  - `정류장 CSV 다운로드`
  - `정류장 CSV 업로드`
- Current CSV contract:
  - `stop_key`
  - `route_name`
  - `stop_name`
  - `lat`
  - `lng`
  - `boarding_count`
- Server endpoints added:
  - `GET /api/stop-ridership`
  - `POST /api/stop-ridership-import`
- Persistence behavior:
  - ridership values are written to `exports/stop-ridership.json`
  - imported values are reflected in the stop list, stop detail panel, and exported KML `ExtendedData` as `ridership`
- UI follow-up fix:
  - the CSV buttons were moved to a separate lower row so the top save/action button grid is no longer broken
- Pre-deploy verification passed:
  - `node --check app.js`
  - `node --check server.js`
  - local root `http://localhost:8080/` returned `200`
  - local `GET /api/stop-ridership` returned `{"ok":true,"updatedAt":null,"records":[]}` before first import

## Next Resume Prompt

Use this next time:

```text
C:\Users\wls29\Desktop\my-map-app\kml-kakao-map 프로젝트와
C:\Users\wls29\Desktop\kcgbus-render 배포 저장소를 불러와서
SESSION_NOTES.md 기준으로 최근 작업 맥락 복원하고,
정류장 CSV 다운로드/업로드 탑승객 수 기능과 stop-ridership.json 저장 상태부터 확인한 뒤
탑승객 수 기반 저이용 정류장 후보 분석 UI를 이어서 진행해줘
```
## 2026-03-24 Restore Checkpoint

- Restore was re-run using:
  - `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map`
  - `C:\Users\wls29\Desktop\kcgbus-render`
  - this `SESSION_NOTES.md`
- Current deploy repo HEAD:
  - commit: `8292b4c`
  - message: `Document hyodo data work`
- Current deploy copy still matches the local source for:
  - `app.js`
  - `index.html`
  - `styles.css`
- Verified current route UI/help state still includes:
  - `전체노선 비교분석`
  - bundled route-list cards
  - separated `경로 설계` / `관찰 구역` panels
  - text-style `열기` / `닫기` toggles
  - updated help text for the dashboard and route-list bundles
- Local server restart check succeeded on `http://localhost:8080` with:
  - root `200`
  - `/health`: `{"ok":true,"port":8080,"openAiConfigured":false,"kakaoMobilityConfigured":true}`
- Resume guidance:
  - the old March UI changes remain deployed in source form and do not need to be reconstructed
  - current newer work after those UI changes is still centered on `hyodo` passenger data preparation/documentation
