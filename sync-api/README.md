# TomEng Cloud Sync API

Neon Function used by TomEng's static GitHub Pages frontend. It accepts only
Neon Auth EdDSA JWTs for the allow-listed, verified owner account. The database
role is scoped to the `tomeng_sync` database and `public` schema; the API reads
and writes only `public.tomeng_cloud_state`.

The API stores a complete schema-7 TomEng store per authenticated user. It
uses revision-checked upserts so simultaneous device writes return `409` and
the client merges/retries instead of silently replacing the other device's
state. The frontend keeps localStorage as its offline copy and syncs after a
local save when a session is active.

Required function environment values (configure in Neon, never commit them):

- `DATABASE_URL`: connection string for the scoped `tomeng_sync_api` role.
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`: values from this branch's Neon Auth.
- `TOMENG_OWNER_EMAIL`: verified owner email allow-list.
- `TOMENG_APP_ORIGIN`: `https://johnny-bui.github.io`.

Build with `npm ci && npm run bundle`, then deploy `dist/index.mjs` in a
ZIP archive as `index.mjs` to the `tomengsync` Neon Function.
