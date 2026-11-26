import { neon } from '@neondatabase/serverless';
import { createPublicKey, verify } from 'node:crypto';

const sql = neon(process.env.DATABASE_URL);
const APP_ORIGIN = process.env.TOMENG_APP_ORIGIN;
const OWNER_EMAIL = String(process.env.TOMENG_OWNER_EMAIL || '').trim().toLowerCase();
const AUTH_URL = process.env.NEON_AUTH_BASE_URL;
const JWKS_URL = process.env.NEON_AUTH_JWKS_URL;
const ISSUERS = new Set([AUTH_URL.replace(/\/+$/, ''), new URL(AUTH_URL).origin]);
const MAX_BODY_BYTES = 4 * 1024 * 1024;
let jwksCache = { keys: [], expiresAt: 0 };

function response(body, status, origin) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'vary': 'Origin',
  });
  if (origin === APP_ORIGIN) {
    headers.set('access-control-allow-origin', APP_ORIGIN);
    headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
    headers.set('access-control-allow-headers', 'Authorization, Content-Type');
    headers.set('access-control-max-age', '600');
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

async function getJwks(force = false) {
  if (!force && jwksCache.expiresAt > Date.now() && jwksCache.keys.length) return jwksCache.keys;
  const result = await fetch(JWKS_URL, { headers: { accept: 'application/json' } });
  if (!result.ok) throw new Error('Auth signing keys unavailable');
  const data = await result.json();
  if (!Array.isArray(data.keys)) throw new Error('Invalid Auth signing keys');
  jwksCache = { keys: data.keys, expiresAt: Date.now() + 5 * 60 * 1000 };
  return jwksCache.keys;
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url');
}

async function verifyAccessToken(headerValue) {
  const match = /^Bearer\s+([A-Za-z0-9_.-]+)$/i.exec(headerValue || '');
  if (!match) return null;
  const tokenParts = match[1].split('.');
  if (tokenParts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = JSON.parse(decodeBase64Url(tokenParts[0]).toString('utf8'));
    payload = JSON.parse(decodeBase64Url(tokenParts[1]).toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'EdDSA' || typeof header.kid !== 'string') return null;

  let key = (await getJwks()).find((candidate) => candidate.kid === header.kid);
  if (!key) key = (await getJwks(true)).find((candidate) => candidate.kid === header.kid);
  if (!key || key.kty !== 'OKP' || key.crv !== 'Ed25519') return null;

  let signatureIsValid = false;
  try {
    const publicKey = createPublicKey({ key, format: 'jwk' });
    signatureIsValid = verify(null, Buffer.from(`${tokenParts[0]}.${tokenParts[1]}`), publicKey, decodeBase64Url(tokenParts[2]));
  } catch {
    return null;
  }
  if (!signatureIsValid) return null;

  const now = Math.floor(Date.now() / 1000);
  const audience = payload.aud;
  const audienceMatches = audience === undefined || ISSUERS.has(audience) || (Array.isArray(audience) && audience.some((item) => ISSUERS.has(item)));
  if (!ISSUERS.has(payload.iss) || !audienceMatches || !Number.isFinite(payload.exp) || payload.exp <= now) return null;
  if (Number.isFinite(payload.nbf) && payload.nbf > now + 30) return null;
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 200) return null;
  const emailIsVerified = payload.emailVerified === true || payload.email_verified === true;
  if (typeof payload.email !== 'string' || payload.email.trim().toLowerCase() !== OWNER_EMAIL || !emailIsVerified) return { forbidden: true };
  return { userId: payload.sub };
}

function validState(state) {
  return state && typeof state === 'object' && !Array.isArray(state) && Number(state.schemaVersion) === 7 &&
    Array.isArray(state.saved) && Array.isArray(state.learned) && Array.isArray(state.introducedPhraseIds) &&
    Array.isArray(state.sessions) && state.completions && typeof state.completions === 'object' &&
    state.reviews && typeof state.reviews === 'object' && state.contentEdits && typeof state.contentEdits === 'object';
}

async function readRemote(userId) {
  const rows = await sql`SELECT payload, revision, updated_at FROM public.tomeng_cloud_state WHERE user_id = ${userId} LIMIT 1`;
  const row = rows[0];
  return row ? { state: row.payload, revision: Number(row.revision), updatedAt: row.updated_at } : { state: null, revision: 0, updatedAt: null };
}

function validSpeakingInput(input) {
  const phraseId = String(input?.phraseId || '');
  const transcript = String(input?.transcript || '').trim();
  const requestKey = String(input?.requestKey || '');
  const number = Number(phraseId.slice(1));
  return /^p(?:00[1-9]|0[1-9]\d|[1-9]\d{2}|1[01]\d{2}|1200)$/.test(phraseId) && number >= 1 && number <= 1200 &&
    transcript.length >= 1 && transcript.length <= 600 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)
    ? { phraseId, transcript, requestKey } : null;
}

async function speakingRequest(request, userId, origin, url) {
  if (request.method === 'GET') {
    const id = url.searchParams.get('id');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')) return response({ error: 'invalid_id' }, 400, origin);
    const rows = await sql`SELECT id, phrase_id, transcript, status, result, error_code, created_at, updated_at
      FROM public.tomeng_speaking_analysis WHERE id = ${id}::uuid AND user_id = ${userId} LIMIT 1`;
    return rows[0] ? response({ job: rows[0] }, 200, origin) : response({ error: 'not_found' }, 404, origin);
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 2048) return response({ error: 'payload_too_large' }, 413, origin);
  let input;
  try { input = validSpeakingInput(JSON.parse(raw)); } catch { /* invalid input */ }
  if (!input) return response({ error: 'invalid_input' }, 400, origin);
  const existing = await sql`SELECT id, status FROM public.tomeng_speaking_analysis
    WHERE user_id = ${userId} AND request_key = ${input.requestKey}::uuid LIMIT 1`;
  if (existing[0]) return response({ job: existing[0] }, 200, origin);
  const limits = await sql`SELECT
    count(*) FILTER (WHERE created_at > now() - interval '1 minute')::int AS recent,
    count(*) FILTER (WHERE status IN ('pending','running'))::int AS open
    FROM public.tomeng_speaking_analysis WHERE user_id = ${userId}`;
  if (limits[0].recent >= 10 || limits[0].open >= 3) return response({ error: 'too_many_requests' }, 429, origin);
  const rows = await sql`INSERT INTO public.tomeng_speaking_analysis
    (user_id, request_key, phrase_id, transcript)
    VALUES (${userId}, ${input.requestKey}::uuid, ${input.phraseId}, ${input.transcript})
    ON CONFLICT (user_id, request_key) DO UPDATE SET request_key = EXCLUDED.request_key
    RETURNING id, status`;
  return response({ job: rows[0] }, 202, origin);
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin');
    if (origin !== APP_ORIGIN) return response({ error: 'origin_not_allowed' }, 403, origin);
    if (request.method === 'OPTIONS') return response({}, 204, origin);
    if (!['GET', 'POST'].includes(request.method)) return response({ error: 'method_not_allowed' }, 405, origin);

    let auth;
    try {
      auth = await verifyAccessToken(request.headers.get('authorization'));
    } catch (error) {
      console.error('TomEng Auth verification unavailable:', error?.message || 'unknown error');
      return response({ error: 'auth_unavailable' }, 503, origin);
    }
    if (!auth) return response({ error: 'unauthorized' }, 401, origin);
    if (auth.forbidden) return response({ error: 'account_not_allowed' }, 403, origin);

    const url = new URL(request.url);
    if (url.pathname === '/speaking-analysis') {
      try { return await speakingRequest(request, auth.userId, origin, url); }
      catch (error) {
        console.error('TomEng speaking request failed:', error?.message || 'unknown error');
        return response({ error: 'analysis_unavailable' }, 503, origin);
      }
    }
    if (!['/', '/sync'].includes(url.pathname)) return response({ error: 'not_found' }, 404, origin);

    try {
      if (request.method === 'GET') return response(await readRemote(auth.userId), 200, origin);

      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return response({ error: 'payload_too_large' }, 413, origin);
      let input;
      try { input = JSON.parse(raw); } catch { return response({ error: 'invalid_json' }, 400, origin); }
      if (!validState(input?.state)) return response({ error: 'invalid_state' }, 400, origin);
      const expectedRevision = Number(input.revision);
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) return response({ error: 'invalid_revision' }, 400, origin);

      const stateJson = JSON.stringify(input.state);
      const changed = await sql`
        INSERT INTO public.tomeng_cloud_state (user_id, payload, revision, updated_at)
        VALUES (${auth.userId}, ${stateJson}::jsonb, 1, now())
        ON CONFLICT (user_id) DO UPDATE SET
          payload = EXCLUDED.payload,
          revision = public.tomeng_cloud_state.revision + 1,
          updated_at = now()
        WHERE public.tomeng_cloud_state.revision = ${expectedRevision}
        RETURNING payload, revision, updated_at
      `;
      if (changed[0]) return response({ state: changed[0].payload, revision: Number(changed[0].revision), updatedAt: changed[0].updated_at }, 200, origin);
      return response({ conflict: true, ...(await readRemote(auth.userId)) }, 409, origin);
    } catch (error) {
      console.error('TomEng sync request failed:', error?.message || 'unknown error');
      return response({ error: 'sync_unavailable' }, 503, origin);
    }
  },
};
