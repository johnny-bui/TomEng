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
  assert.equal(await getJWTToken({ getJWTToken: async () => 'jwt-direct' }), 'jwt-direct',
    'the current Neon SDK returns its JWT directly from getJWTToken()');
  assert.equal(await getJWTToken({ getJWTToken: async () => '  jwt-trimmed  ' }), 'jwt-trimmed',
    'JWT strings are normalized before use');
  assert.equal(await getJWTToken({ getJWTToken: async () => null, token: async () => ({ data: { token: 'legacy' } }) }), null,
    'a present canonical SDK helper is authoritative when no authenticated JWT exists');
  assert.equal(await getJWTToken({ token: async () => ({ data: { token: 'legacy-token' } }) }), 'legacy-token',
    'older SDK clients retain the response-wrapped token fallback');
  assert.equal(await getJWTToken({ token: async () => ({ data: {} }) }), null,
    'missing token data is reported as unavailable');
  assert.equal(await getJWTToken({}), null,
    'unsupported auth clients do not fabricate a token');
  console.log('PASS: Neon auth response session, user, and JWT normalization');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

