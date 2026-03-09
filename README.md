# KML Kakao Map

KML upload, point editing, route design, and route analysis tool built on Kakao Map.

## Run

1. Set your Kakao JavaScript key in `config.js`.
2. Register `http://localhost:8080` in the Kakao developer console.
3. Optionally set environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `KAKAO_MOBILITY_REST_API_KEY`
4. Start the local server:

```powershell
npm start
```

## Endpoints

- `GET /`
- `GET /health`
- `POST /api/save-kml`
- `POST /api/save-analysis`
- `POST /api/analyze-routes`
- `POST /api/design-route`

## Notes

- Exported files are stored under `exports/`.
- `OPENAI_API_KEY` is only needed for GPT-based analysis.
- `KAKAO_MOBILITY_REST_API_KEY` is needed for route design requests.
