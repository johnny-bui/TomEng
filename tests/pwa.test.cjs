const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const handlers = {};
const cacheShell = [];
const deleted = [];
let skipped = false;
let claimed = false;
const cache = { addAll: async assets => cacheShell.push(...assets), put: async () => {} };
const sandbox = {
  self: {
    location: { origin: 'https://example.test' },
    clients: { claim: async () => { claimed = true; } },
    addEventListener: (name, callback) => { handlers[name] = callback; },
    skipWaiting: async () => { skipped = true; }
  },
  caches: {
    open: async () => cache,
    keys: async () => ['tomeng-v9-native', 'tomeng-v10-native'],
    delete: async key => { deleted.push(key); return true; },
    match: async () => null
  },
  URL,
  fetch: async request => ({ ok: true, clone(){return this;}, request }),
  Response: { error: () => ({ error: true }) }
};
vm.runInNewContext(source, sandbox);

(async () => {
  let installPromise;
  handlers.install({ waitUntil: promise => { installPromise = promise; } });
  await installPromise;
  assert.ok(skipped, 'install activates the updated worker without waiting for an old tab');
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3.js'));
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3_1.js'));
  assert.ok(cacheShell.includes('./app.js'));

  let activatePromise;
  handlers.activate({ waitUntil: promise => { activatePromise = promise; } });
  await activatePromise;
  assert.deepEqual(deleted, ['tomeng-v9-native']);
  assert.ok(claimed, 'new worker controls open clients');

  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /sw\.js\?v=10-native/);
  assert.ok(index.indexOf('legacy-lesson-plan-v3.js') < index.indexOf('app.js'));
  assert.ok(index.indexOf('legacy-lesson-plan-v3_1.js') < index.indexOf('app.js'));
  for (const asset of cacheShell) assert.ok(fs.existsSync(path.join(root, asset.replace(/^\.\//, ''))), `precache asset exists: ${asset}`);
  console.log('PASS: service worker cache version, migration-plan precache, install/activate and asset existence');
})().catch(error => { console.error(error); process.exitCode = 1; });
