const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sources = ['data.js','meta.js','app.js'].map((file) => fs.readFileSync(path.join(root,file),'utf8'));
function boot(seed = {}) {
  const storage = new Map(Object.entries(seed));
  const elements = new Map();
  const document = {
    activeElement:null,
    querySelector(selector) { if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},setSelectionRange(){}});return elements.get(selector); },
    addEventListener(type,fn) { this[`on${type}`]=fn; },
    createElement() { return {click(){},set href(v){},set download(v){}}; }
  };
  const sandbox={document,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{},location:{protocol:'file:'},console,setTimeout,clearTimeout,Intl,Date,Blob:class{},URL:{createObjectURL(){return 'blob:'},revokeObjectURL(){}},window:null};
  sandbox.window=sandbox;sandbox.scrollTo=()=>{};sandbox.confirm=()=>true;
  vm.createContext(sandbox);
  for(const source of sources)vm.runInContext(source,sandbox);
  const click=(dataset)=>sandbox.document.onclick({target:{closest:()=>({dataset,tagName:'BUTTON'})},stopPropagation(){}});
  return {app:sandbox.TomEng,storage,document,click,html:()=>document.querySelector('#app').innerHTML};
}

// Fresh install starts at lesson 1 and cannot mark phrases complete in Library.
const fresh=boot();
assert.equal(fresh.app.getState().activeSession.lessonId,'day-001');
assert.equal(fresh.app.phraseCount,1200);
assert.equal(fresh.app.getState().activeSession.phase,'learn');
assert.match(fresh.html(),/240 trang/);
fresh.click({action:'save',id:'p001'});
assert.equal(Object.keys(fresh.app.getState().completions).length,0,'bookmarking must not complete a lesson');
fresh.click({action:'continue'});
assert.match(fresh.html(),/Học 5 câu mới/);
for(let i=0;i<5;i++){
  fresh.click({action:'reveal'});
  assert.match(fresh.html(),/data-mark="ready"/);
  const phraseId=`p${String(i+1).padStart(3,'0')}`;
  fresh.click({action:'practice-mark',id:phraseId,mark:'ready'});
}
assert.equal(fresh.app.getState().activeSession.phase,'quick');
assert.equal(Object.keys(fresh.app.getState().completions).length,0,'lesson requires all five recall ratings');
for(let i=0;i<5;i++){
  fresh.click({action:'quick-reveal'});
  const state=fresh.app.getState(), ids=JSON.parse(fresh.storage.get('tomeng_reflex_v3')).activeSession;
  const phraseId=state.activeSession.lessonId==='day-001'?`p${String(i+1).padStart(3,'0')}`:'';
  fresh.click({newRating:'good',id:phraseId});
}
assert.equal(Object.keys(fresh.app.getState().completions).length,1);
assert.equal(fresh.app.getState().activeSession.reviewLessonId,'day-001');
fresh.click({action:'continue'});
assert.match(fresh.html(),/Ôn trang 001/);
for(let i=0;i<5;i++){
  assert.doesNotMatch(fresh.html(),/data-rating="good"/);
  fresh.click({action:'reveal'});
  assert.match(fresh.html(),/data-rating="good"/);
  fresh.click({rating:'good',id:`p${String(i+1).padStart(3,'0')}`});
}
assert.equal(fresh.app.getState().activeSession.lessonId,'day-002');
assert.equal(fresh.app.getState().activeSession.phase,'learn');
assert.equal(fresh.app.getNextInterval({repetitions:0,interval:0},'good'),1);
assert.equal(fresh.app.getNextInterval({repetitions:1,interval:1},'good'),3);
assert.equal(fresh.app.getNextInterval({repetitions:2,interval:3},'good'),7);
assert.equal(fresh.app.getNextInterval({repetitions:3,interval:7},'good'),14);
assert.equal(fresh.app.getNextInterval({repetitions:4,interval:14},'good'),30);
assert.equal(fresh.app.getNextInterval({repetitions:4,interval:14},'again'),1);
assert.equal(fresh.app.shiftDate('2026-12-31',1),'2027-01-01');
assert.equal(fresh.app.shiftDate('2024-02-28',1),'2024-02-29');

// Migration keeps legacy IDs/bookmarks, snapshots raw data, and infers only complete 5-ID days.
const legacyIds=Array.from({length:7},(_,i)=>`p${String(i+1).padStart(3,'0')}`);
const migrated=boot({'tomeng_notebook_v2':JSON.stringify({saved:['p001','p1200'],learned:legacyIds,accent:'en-GB',streak:4})});
const migratedState=migrated.app.getState();
assert.deepEqual(Array.from(migratedState.saved),['p001','p1200']);
assert.deepEqual(Array.from(migratedState.learned),legacyIds);
assert.equal(migratedState.completions['day-001'].migrated,true);
assert.equal(migratedState.completions['day-002'],undefined);
assert.ok(migrated.storage.has('tomeng_migration_backup_v3'));
assert.equal(migratedState.streak,0);

// Rescue Mode returns three real records and caps the optional due queue at twelve.
fresh.click({page:'rescue'});
assert.equal((fresh.html().match(/class="rescue-card"/g)||[]).length,3);
const queueReviews={};for(let i=1;i<=20;i++)queueReviews[`p${String(i).padStart(3,'0')}`]={dueDate:'2000-01-01',repetitions:1,interval:1};
const queue=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:[],learned:[],completions:{},reviews:queueReviews})});
queue.click({page:'due'});
assert.equal((queue.html().match(/class="due-card"/g)||[]).length,12);

// Day 30 unlocks 31; after Day 240 the app stays in maintenance instead of looping.
const completions={};for(let day=1;day<=30;day++)completions[`day-${String(day).padStart(3,'0')}`]={day,lessonId:`day-${String(day).padStart(3,'0')}`};
const day30=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:[],learned:[],completions,lastCompletedLessonId:'day-030'})});
assert.equal(day30.app.getState().activeSession.lessonId,'day-031');
for(let day=31;day<=240;day++)completions[`day-${String(day).padStart(3,'0')}`]={day,lessonId:`day-${String(day).padStart(3,'0')}`};
const day240=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:[],learned:[],completions,lastCompletedLessonId:'day-240'})});
assert.equal(day240.app.getState().activeSession,null);
assert.match(day240.html(),/hoàn thành 240 trang/i);
console.log('PASS: fresh 5 phrase flow, review-before-new, SRS intervals, legacy migration, Day 30/31 and Day 240 maintenance');
