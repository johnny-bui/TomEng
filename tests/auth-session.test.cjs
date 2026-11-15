const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'auth-session.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const resolve = sandbox.window.TOMENG_AUTH_SESSION.resolve;
const session = { id: 'session-1', token: 'test-token' };
const user = { id: 'user-1', name: 'TomEng' };

assert.deepEqual(JSON.parse(JSON.stringify(resolve({ data: { session, user } }))), { session, user },
  'Neon places user beside session at data.user');
assert.deepEqual(JSON.parse(JSON.stringify(resolve({ data: { session: { ...session, user } } }))), { session: { ...session, user }, user },
  'nested session.user remains supported for compatible responses');
assert.deepEqual(JSON.parse(JSON.stringify(resolve({ data: { session: null, user: null } }, { data: { session, user } }))), { session, user },
  'successful sign-in response remains a fallback when an immediate session refresh is empty');
assert.deepEqual(JSON.parse(JSON.stringify(resolve({ data: { session: null, user } }))), { session: null, user },
  'user is not lost just because the API session object is not nested');
assert.deepEqual(JSON.parse(JSON.stringify(resolve({}))), { session: null, user: null });

const getJWTToken = sandbox.window.TOMENG_AUTH_SESSION.getJWTToken;
(async () => {
  let legacyCalls = 0;
  const vanillaAuth = {
    getSession: async () => ({ data: { session: { token: '  session-jwt  ' }, user } }),
    token: async () => { legacyCalls++; throw new Error('HTTP 404'); }
  };
  assert.equal(await getJWTToken(vanillaAuth), 'session-jwt',
    'createAuthClient vanilla adapter exposes the JWT in getSession and must not call the unsupported token route');
  assert.equal(legacyCalls, 0, 'unsupported token endpoint is never requested');
  assert.equal(await getJWTToken({ getSession: async () => ({ data: { session: null } }), token: vanillaAuth.token }), null,
    'an expired session cannot fall through to the 404 token route');
  assert.equal(await getJWTToken({ getSession: async () => ({ error: new Error('session unavailable') }) })
    .then(() => 'resolved', error => error.message), 'session unavailable',
    'a session service error remains visible to the caller');
  assert.equal(await getJWTToken({ getJWTToken: async () => 'direct-jwt' }), 'direct-jwt',
    'the Neon wrapper helper remains supported when supplied directly');
  assert.equal(await getJWTToken({}), null, 'unsupported clients do not fabricate a token');
  console.log('PASS: Neon auth response session, user, and JWT normalization');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

