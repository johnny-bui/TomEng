/**
 * Feature Name : Deep Analysis worker — ChatGPT plan auth (SNT-DEEP-V1 · P2)
 * Version      : 1.0.0 (2026-11-22)
 * Author       : Claude (implementation) · Johnny Bui (product owner)
 * Purpose      : Official "Sign in with ChatGPT" open-source/local flow: dynamic client registration,
 *                PKCE S256, 127.0.0.1 loopback, ID-token verification (JWKS, iss/aud/exp/nonce),
 *                rotating refresh. Credentials live ONLY in ~/.tomeng-chatgpt/credentials.json (0600),
 *                written atomically. Tokens are never logged.
 */
// ===== INIT =====
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { tokenNeedsRefresh } from "./policy.mjs";
const AUTH_BASE = "https://auth.openai.com";
const AUTHORIZE_URL = `${AUTH_BASE}/api/accounts/authorize`;
const TOKEN_URL = `${AUTH_BASE}/api/accounts/oauth/token`;
export const RESOURCE = "https://api.openai.com/v1";
const SCOPES = "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
const PLAN_SCOPE = "chatgpt.tokens.use.direct";
const AGENT_NAME = "TomEng";
const PORT = Number(process.env.TOMENG_SIWC_PORT || 1456);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/auth/callback`;
export const WORKER_DIR = path.join(os.homedir(), ".tomeng-chatgpt");
const CRED_FILE = path.join(WORKER_DIR, "credentials.json");
const HOST_FILE = path.join(WORKER_DIR, "host-id");
export class AuthNeedsLogin extends Error {
    constructor(reason) { super(`AUTH_NEEDS_LOGIN: ${reason}`); }
}
// ===== HELPERS =====
const b64url = (buf) => buf.toString("base64url");
const rand = (n = 32) => b64url(crypto.randomBytes(n));
function writeAtomic(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, data, { mode: 0o600 });
    fs.renameSync(tmp, file);
    fs.chmodSync(file, 0o600);
}
function hostId() {
    if (fs.existsSync(HOST_FILE))
        return fs.readFileSync(HOST_FILE, "utf8").trim();
    const id = `urn:uuid:${crypto.randomUUID()}`;
    writeAtomic(HOST_FILE, id);
    return id;
}
export function loadCredentials() {
    return fs.existsSync(CRED_FILE) ? JSON.parse(fs.readFileSync(CRED_FILE, "utf8")) : null;
}
export function credentialsMtimeMs() { return fs.existsSync(CRED_FILE) ? fs.statSync(CRED_FILE).mtimeMs : 0; }
function saveCredentials(c) { writeAtomic(CRED_FILE, JSON.stringify(c, null, 2)); }
async function postForm(url, fields) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(30_000) });
    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        json = { error: "non_json", status: res.status };
    }
    return { status: res.status, json };
}
function merge(prev, tok, extra = {}) {
    return {
        ...(prev ?? {}), ...extra,
        access_token: String(tok.access_token),
        refresh_token: tok.refresh_token ?? prev?.refresh_token,
        id_token: tok.id_token ?? prev?.id_token,
        token_type: tok.token_type ?? "Bearer",
        expires_in: typeof tok.expires_in === "number" ? tok.expires_in : prev?.expires_in,
        scopes: typeof tok.scope === "string" ? tok.scope.split(/\s+/) : prev?.scopes ?? [],
        saved_at: new Date().toISOString(),
    };
}
/** Verify the ID token: RS256 signature against OpenAI's JWKS, then iss, aud, exp, nonce. */
async function verifyIdToken(idToken, clientId, nonce) {
    const [h, p, s] = idToken.split(".");
    if (!h || !p || !s)
        throw new Error("ID_TOKEN_MALFORMED");
    const header = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    const claims = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    if (header.alg !== "RS256")
        throw new Error(`ID_TOKEN_ALG_${header.alg}`);
    let jwksUri = `${AUTH_BASE}/.well-known/jwks.json`;
    try {
        const disc = await fetch(`${AUTH_BASE}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(15_000) });
        if (disc.ok)
            jwksUri = (await disc.json()).jwks_uri ?? jwksUri;
    }
    catch { /* fall back to the conventional path */ }
    const jwks = (await (await fetch(jwksUri, { signal: AbortSignal.timeout(15_000) })).json());
    const jwk = jwks.keys.find(k => k.kid === header.kid);
    if (!jwk)
        throw new Error("ID_TOKEN_KID_UNKNOWN");
    const ok = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), crypto.createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(s, "base64url"));
    if (!ok)
        throw new Error("ID_TOKEN_SIGNATURE_INVALID");
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== AUTH_BASE && claims.iss !== `${AUTH_BASE}/`)
        throw new Error("ID_TOKEN_ISSUER");
    if (!aud.includes(clientId))
        throw new Error("ID_TOKEN_AUDIENCE");
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now() - 60_000)
        throw new Error("ID_TOKEN_EXPIRED");
    if (claims.nonce !== nonce)
        throw new Error("ID_TOKEN_NONCE");
    return { sub: String(claims.sub ?? ""), email: typeof claims.email === "string" ? claims.email : undefined };
}
// ===== EVENTS =====
export async function login() {
    const existing = loadCredentials();
    const verifier = rand(48);
    const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
    const state = rand(16);
    const nonce = rand(16);
    const params = new URLSearchParams({
        response_type: "code", client_id: existing?.client_id || "dynamic_agent_client", ext_agent_host_id: hostId(),
        redirect_uri: REDIRECT_URI, scope: SCOPES, resource: RESOURCE, state, nonce,
        code_challenge: challenge, code_challenge_method: "S256",
    });
    if (!existing?.client_id)
        params.set("agent_name_hint", AGENT_NAME);
    if (existing?.id_token)
        params.set("id_token_hint", existing.id_token);
    const url = `${AUTHORIZE_URL}?${params}`;
    const cb = await new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const u = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
            if (u.pathname !== "/auth/callback") {
                res.writeHead(404).end();
                return;
            }
            const q = Object.fromEntries(u.searchParams);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`<h3>TomEng worker: ${q.error ? "Bị từ chối / lỗi" : "Đăng nhập xong"}</h3><p>Quay lại Terminal.</p>`);
            server.close();
            resolve(q);
        });
        server.on("error", reject);
        server.listen(PORT, "127.0.0.1", () => {
            console.log(`• Mở trình duyệt để đăng nhập ChatGPT (callback ${REDIRECT_URI})…`);
            execFile("open", [url], err => { if (err)
                console.log(`\nMở link này trong trình duyệt:\n${url}\n`); });
        });
        setTimeout(() => { server.close(); reject(new Error("LOGIN_TIMEOUT")); }, 5 * 60_000).unref();
    });
    if (cb.error)
        throw new Error(`OAUTH_${cb.error}`);
    if (cb.state !== state)
        throw new Error("OAUTH_STATE_MISMATCH");
    const clientId = cb.client_id || existing?.client_id;
    if (!clientId)
        throw new Error("OAUTH_NO_CLIENT_ID");
    const { status, json } = await postForm(TOKEN_URL, { grant_type: "authorization_code", client_id: clientId, code: cb.code, code_verifier: verifier, redirect_uri: REDIRECT_URI, resource: RESOURCE });
    if (status !== 200 || typeof json.access_token !== "string")
        throw new Error(`TOKEN_EXCHANGE_${status}_${String(json.error ?? "")}`);
    if (typeof json.id_token !== "string")
        throw new Error("ID_TOKEN_MISSING");
    const identity = await verifyIdToken(json.id_token, clientId, nonce);
    const creds = merge(existing, json, { issuer: AUTH_BASE, client_id: clientId, ext_agent_host_id: hostId(), subject: identity.sub, email: identity.email });
    if (!creds.scopes.includes(PLAN_SCOPE))
        throw new Error("PLAN_SCOPE_NOT_GRANTED");
    saveCredentials(creds);
    return { email: identity.email ?? identity.sub };
}
export async function refresh() {
    const c = loadCredentials();
    if (!c?.refresh_token)
        throw new AuthNeedsLogin("no refresh token");
    const { status, json } = await postForm(TOKEN_URL, { grant_type: "refresh_token", client_id: c.client_id, refresh_token: c.refresh_token, resource: RESOURCE });
    if (status !== 200 || typeof json.access_token !== "string") {
        if (status === 400 || status === 401)
            throw new AuthNeedsLogin(`refresh ${status} ${String(json.error ?? "")}`);
        throw new Error(`REFRESH_${status}`);
    }
    const next = merge(c, json);
    saveCredentials(next);
    return next;
}
/** Valid access token, refreshed when it expires within 5 minutes (or when forced after a 401). */
export async function accessToken(options = {}) {
    const c = loadCredentials();
    if (!c?.access_token)
        throw new AuthNeedsLogin("no credentials");
    if (!c.scopes?.includes(PLAN_SCOPE))
        throw new AuthNeedsLogin("plan scope missing");
    if (!options.force && !tokenNeedsRefresh(c.saved_at, c.expires_in, new Date()))
        return c.access_token;
    return (await refresh()).access_token;
}
