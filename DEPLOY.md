# Deploy Notes

This folder is a deployment copy of `C:\kml-kakao-map`.

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

## Notes

- `server.js` in this folder uses `process.env.PORT` for hosting platforms.
- `exports/` is where saved files are written. Use persistent disk/volume storage on the hosting platform if you need those files to survive restarts.
- If you deploy with a new public URL, add that URL to Kakao Developers JavaScript SDK allowed domains.
