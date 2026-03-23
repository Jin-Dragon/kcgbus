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
