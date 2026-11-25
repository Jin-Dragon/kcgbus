# Deploy Notes

This folder is a deployment copy of `C:\kml-kakao-map`.

## Build command

```bash
npm ci
```

## Start command

```bash
npm start
```

or

```bash
node server.js
```

## Required environment variables

- `PORT`
- `KAKAO_MOBILITY_REST_API_KEY`

## Optional environment variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SEOUL_OPEN_DATA_API_KEY` for monthly refresh of Seoul bus ridership

## Notes

- `server.js` in this folder uses `process.env.PORT` for hosting platforms.
- `exports/` is where saved files are written. Use persistent disk/volume storage on the hosting platform if you need those files to survive restarts.
- If you deploy with a new public URL, add that URL to Kakao Developers JavaScript SDK allowed domains.

## Seoul stop ridership

The bundled October 2026 snapshot provides the stop list and monthly boarding and alighting totals when the API key or a newer cache is unavailable. Seoul Metropolitan Government supplied the source data through [bus ridership by route, stop and hour](https://data.seoul.go.kr/dataList/OA-12913/S/1/datasetView.do) and the [stop master dataset](https://data.seoul.go.kr/dataList/OA-21231/A/1/datasetView.do) (KOGL Type 1). WonderLinx sums the published hourly counts across routes by official stop ID and joins station names, ARS numbers and coordinates from the stop master.
