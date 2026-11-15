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

console.log('PASS: Neon auth response session and user normalization');
