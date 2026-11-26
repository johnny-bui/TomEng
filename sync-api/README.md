# TomEng Cloud Sync API

Neon Function used by TomEng's static GitHub Pages frontend. It accepts only
Neon Auth EdDSA JWTs for the allow-listed, verified owner account. The database
role is scoped to the `tomeng_sync` database and `public` schema; the API reads
and writes `public.tomeng_cloud_state` and enqueues owner-scoped jobs in
`public.tomeng_speaking_analysis`.

The API stores a complete schema-7 TomEng store per authenticated user. It
uses revision-checked upserts so simultaneous device writes return `409` and
the client merges/retries instead of silently replacing the other device's
state. The frontend keeps localStorage as its offline copy and syncs after a
local save when a session is active.

The `/speaking-analysis` POST and GET routes use the same verified owner JWT.
POST accepts only a phrase ID, editable transcript and idempotency UUID. The
worker reads the canonical lesson from source and writes feedback to the job;
no ChatGPT credential enters this Function or the frontend. The speaking job
table is separate from the learning store, so analysis cannot change progress.
Apply `migrations/20261126_speaking_analysis.sql` and grant this API role
`SELECT, INSERT, UPDATE` on that table before deploying the new bundle.

Required function environment values (configure in Neon, never commit them):

- `DATABASE_URL`: connection string for the scoped `tomeng_sync_api` role.
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`: values from this branch's Neon Auth.
- `TOMENG_OWNER_EMAIL`: verified owner email allow-list.
- `TOMENG_APP_ORIGIN`: `https://johnny-bui.github.io`.

Build with `npm ci && npm run bundle`, then deploy `dist/index.mjs` in a
ZIP archive as `index.mjs` to the `tomengsync` Neon Function.
