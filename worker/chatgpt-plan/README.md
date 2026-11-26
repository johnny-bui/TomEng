# TomEng speaking worker

The Mac worker uses its own Sign in with ChatGPT grant. It never puts the grant or a database password into the GitHub Pages app. The app submits an editable speech transcript to the owner-scoped Neon queue; the worker evaluates it against the canonical phrase and stores structured feedback. Learning progress is not modified by analysis.

```bash
node worker/chatgpt-plan/cli.mjs status
node worker/chatgpt-plan/cli.mjs login
node worker/chatgpt-plan/cli.mjs probe
node worker/chatgpt-plan/cli.mjs sample
```

Credentials are stored in `~/.tomeng-chatgpt/credentials.json` with mode `0600`. The owner must approve OpenAI access in the browser. Do not commit this file, `worker.env`, tokens, or a database URL.

Apply `sync-api/migrations/20261126_speaking_analysis.sql` before deploying the API. Grant the API role `SELECT, INSERT, UPDATE` on `public.tomeng_speaking_analysis`. Create a separate worker role with only `SELECT, UPDATE` on that table. Set `TOMENG_WORKER_DATABASE_URL` and optional `TOMENG_AI_MODEL` in `~/.tomeng-chatgpt/worker.env` (mode `0600`). The URL must use the worker role.

```bash
node worker/chatgpt-plan/cli.mjs once   # one queued job
node worker/chatgpt-plan/cli.mjs start  # continuous worker
```

`vn.tomeng.speaking-worker.plist` is a launchd template for keeping the worker running when the Mac is awake. If the Mac is asleep, queued jobs remain pending and the user can refresh the result later. A revoked grant or exhausted plan allowance pauses jobs; it does not erase transcripts or learning progress.
