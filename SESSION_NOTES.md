# Session Notes

## 2026-04-01 Route Time Simulation Deploy Update

- Deploy source refreshed from:
  - `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map`
- Deployed UI update:
  - each route-list group now includes `운행시간 시뮬레이션`
- Simulation popup flow now includes:
  - route multi-select with `전체선택` / `전체해제`
  - default dwell-time input in seconds
  - start hour / end hour / interval minutes
  - fixed bus vehicle type display
  - lower log panel for runtime status and error output
- Simulation result flow now includes:
  - popup result tables by route and time slot
  - drive time / dwell adjustment / total time / distance
  - Excel-friendly CSV download
- Current simulation backend logic:
  - chunk size is 5 stops
  - route stop coordinates are snapped toward route path coordinates before Kakao requests
  - server retries future-directions requests with candidate snapped coordinates when needed
  - active local debug build tag is `2026-04-01-route-time-debug-3`
- Deploy server note:
  - `server.js` in deploy repo still keeps `const PORT = Number(process.env.PORT) || 8080;`

## 2026-04-01 Restore Checkpoint

- Restore re-run using:
  - `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map`
  - `C:\Users\wls29\Desktop\kcgbus-render`
  - both `SESSION_NOTES.md` files
- Local source reconfirmed for the latest ridership work:
  - stop ridership CSV import is reflected in the stop detail panel and stop list
  - each route-list group header exposes a `탑승객 분석` button
  - ridership analysis runs through `settings popup -> results popup`
  - results popup can send `저이용 저기여`, `폐기 검토 후보`, and `고이용 고기여` highlights back to the map
  - route-list title rename keeps only the small top `이름` button
  - stop detail panel hides low-value metadata fields including raw ridership metadata
  - stop list right-click menu includes `편집` and `삭제`
- Merge integration status:
  - ridership analysis output is still not applied to the live merge logic
  - only the rules document exists so far in the local source:
    - `C:\Users\wls29\Desktop\my-map-app\kml-kakao-map\merge-with-ridership-analysis-rules.txt`
- Local runtime check during restore:
  - local server restarted and `http://localhost:8080/health` returned `{"ok":true,"port":8080,"openAiConfigured":false,"kakaoMobilityConfigured":false}`
- Deploy note:
  - no deploy repo files were updated in this restore step other than this note

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
## 2026-04-05 Route-Time Simulation Console And Research Update

- Route-time simulation settings were revised:
  - removed per-stop dwell input
  - removed vehicle type input
  - added single-date selection
  - aligned start time, end time, and interval on one row below the date
- Execution flow was revised:
  - simulation now opens a dedicated execution console window
  - the console no longer disappears automatically when computation finishes
  - completion now keeps the console open and highlights a `결과 보기` button
  - the main app now directly attaches the console window reference so live logs continue to stream into the popup
- Results flow was revised:
  - the top route-level `경로보기` button was removed from the simulation result window
  - per-timeslot `경로보기` and `계산로그` remain because routes can differ by departure time
- Bug fixes completed:
  - fixed execution-console `결과 보기` no-response issue by wiring the console popup back to the main app result handler
  - fixed blank `계산로그` popup caused by an undefined `formatRidershipLabel()` reference while building the log text
- Current research-based formula in code:
  - `final operating time = max(kakao drive time, regional average-speed drive time) + dwell adjustment`
  - base dwell is `26 seconds` per stop
  - if ridership inputs are missing, dwell is applied uniformly with weight `1.0`
  - bus-specific extra delay for curb-lane driving/intersection friction is not yet a separate term in code
- Research discussion reached this conclusion:
  - current logs can make it look like only dwell is applied when the regional speed floor is equal to Kakao time
  - the next refinement should separate:
    - Kakao-derived speed
    - regional bus-speed floor
    - applied drive speed
    - dwell adjustment
    - additional bus-delay correction
- Real-world route sample analysis completed for:
  - `C:\Users\wls29\Desktop\my-map-app\버스도착시간 예측관련 문서\3노선_운행데이터.xlsx`
  - extracted usable one-way runs:
    - `2026-03-30`: about `36.5 min`
    - `2026-03-31`: about `42.0 min`
  - mean actual one-way running time: about `39.25 min`
  - with current route distance `7.28 km` and Seoul Sunday speed `15.2 km/h`, residual extra bus delay beyond regional-speed drive time plus base dwell is about `2.71 min`
  - this is about `9.4%` of the regional-speed drive baseline for Route 3
- Next analysis task:
  - inspect `5노선_운행데이터.xlsx` and `6노선_운행데이터.xlsx`
  - derive an average bus-delay correction across Routes `3`, `5`, and `6`
  - then decide whether to implement that correction as a new research-based term in the simulation formula

## Next Resume Prompt

Use this next time:

```text
C:\Users\wls29\Desktop\my-map-app\kml-kakao-map 프로젝트와
C:\Users\wls29\Desktop\kcgbus-render 배포 저장소를 불러와서 SESSION_NOTES.md 기준으로 최근 작업 맥락 복원하고,
운행시간 시뮬레이션 실행콘솔/결과창/계산로그 연결 상태를 먼저 점검한 뒤
C:\Users\wls29\Desktop\my-map-app\버스도착시간 예측관련 문서\3노선_운행데이터.xlsx,
5노선_운행데이터.xlsx, 6노선_운행데이터.xlsx를 같은 방식으로 분석해서
평균적인 버스지체보정값을 산출하고 현재 연구 기반 계산식에 어떻게 반영할지 이어서 정리해줘.
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

## 2026-04-02 Route-Time Simulation Update

- Local route-time simulation work was carried forward into deploy prep:
  - route-time simulation settings/results popup flow is active
  - route popup now supports per-section `강제 포인트 추가`, `경로 재설정`, `포인트 초기화`
  - forced-point order is edited by number only; base 4 stops stay fixed
  - popup left panel scroll is separated from the map view
  - analysis path now shows direction arrows
  - stop markers are back on actual KML stop positions and base API call order follows KML stop order
- Current local Kakao keys updated:
  - `KAKAO_MOBILITY_REST_API_KEY=51a377d1bc39d0398212c122ff31532d`
  - `config.js appKey=e5c44a3738e9c68eeebfe7457b5d138e`
- Render deploy follow-up still required outside git:
  - set Render env `KAKAO_MOBILITY_REST_API_KEY`
  - verify Kakao Developers web platform includes `https://kcgbus-1.onrender.com`

## Next Resume Prompt

Use this next time:

```text
C:\Users\wls29\Desktop\my-map-app\kml-kakao-map 프로젝트와
C:\Users\wls29\Desktop\kcgbus-render 배포 저장소를 불러와서
SESSION_NOTES.md 기준으로 최근 작업 맥락 복원하고,
운행시간 시뮬레이션/강제포인트/경로보기 팝업 상태를 이어서 점검해줘.
특히 KML 실제 정류장 좌표/순서 기준 API 호출과 경로보기 지도 표시가 일치하는지부터 확인해줘.
```
