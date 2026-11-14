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
    keys: async () => ['tomeng-v11-native', 'tomeng-v12-native', 'tomeng-v13-native', 'tomeng-v14-native', 'tomeng-v15-native', 'tomeng-v16-native', 'tomeng-v17-native', 'tomeng-v18-native'],
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
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3_1.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3_2.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./legacy-lesson-plan-v3_3.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./app.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./sync-merge.js?v=3.5.0'));
  assert.ok(cacheShell.includes('./cloud-sync.js?v=3.5.0'));

  let activatePromise;
  handlers.activate({ waitUntil: promise => { activatePromise = promise; } });
  await activatePromise;
  assert.deepEqual(deleted, ['tomeng-v11-native', 'tomeng-v12-native', 'tomeng-v13-native', 'tomeng-v14-native', 'tomeng-v15-native', 'tomeng-v16-native', 'tomeng-v17-native', 'tomeng-v18-native']);
  assert.ok(claimed, 'new worker controls open clients');

  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /sw\.js\?v=18-native/);
  assert.ok(index.indexOf('legacy-lesson-plan-v3.js') < index.indexOf('app.js'));
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.equal((app.match(/const APP_VERSION =/g) || []).length, 1, 'SemVer has one source of truth');
  assert.match(app, /data-app-version=\"\$\{APP_VERSION\}\"/);
  assert.match(app, /appVersion:APP_VERSION/);
  assert.match(css, /\.brand-lockup \.app-version\{display:block\}/);
  assert.match(css, /\.app-version\{font:500 10px\/1\.2/);
  assert.match(css, /@media\(max-width:1160px\)\{\.brand-lockup \.app-version\{display:none\}\.brand-word\{display:flex\}\}/);
  assert.match(app, /class="subcategory-panel" aria-labelledby="subcategory-panel-title"/);
  assert.match(app, /class="subcategory-group" aria-labelledby="subcategory-/);
  assert.match(app, /class="category-tabs" aria-label="Danh mục chính"/);
  assert.match(app, /class="view-switch" role="group" aria-label="Chế độ xem nội dung"/);
  assert.match(css, /\.view-switch button\[aria-pressed="true"\]/, 'view mode has its own segmented selected state');
  assert.match(css, /\.category-tab\.selected\{[^}]*background:#292925/, 'primary category uses a strong selected state');
  assert.match(css, /\.subcategory-chip\.selected\{[^}]*background:#f9e1dd/, 'subcategory uses a lighter selected state');
  assert.match(css, /@media\(max-width:720px\)\{[\s\S]*?\.category-tabs\{flex-wrap:nowrap;overflow-x:auto/, 'mobile category tabs scroll without shrinking labels');
  assert.ok(index.indexOf('legacy-lesson-plan-v3_1.js') < index.indexOf('app.js'));
  assert.ok(index.indexOf('legacy-lesson-plan-v3_2.js') < index.indexOf('app.js'));
  assert.ok(index.indexOf('legacy-lesson-plan-v3_3.js') < index.indexOf('app.js'));
  assert.ok(index.indexOf('sync-merge.js') < index.indexOf('cloud-sync.js'));
  for (const asset of cacheShell) assert.ok(fs.existsSync(path.join(root, asset.replace(/^\.\//, ''))), `precache asset exists: ${asset}`);
  console.log('PASS: service worker cache version, migration-plan precache, install/activate and asset existence');
})().catch(error => { console.error(error); process.exitCode = 1; });
