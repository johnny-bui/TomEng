const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sources = ['legacy-v2-fingerprints.js','data.js','meta.js','app.js'].map(file => fs.readFileSync(path.join(root,file),'utf8'));
function boot(seed = {}, day = '2026-11-11') {
  const storage = new Map(Object.entries(seed));
  const elements = new Map();
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [day+'T12:00:00'])); }
    static now() { return new Date(day+'T12:00:00').getTime(); }
  }
  const document = {
    activeElement:null,
    querySelector(selector) { if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},setSelectionRange(){}});return elements.get(selector); },
    addEventListener(type,fn) { this['on'+type]=fn; },
    createElement() { return {click(){},set href(v){},set download(v){}}; }
  };
  const sandbox={document,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{},location:{protocol:'file:'},console,setTimeout,clearTimeout,Intl,Date:ClockDate,Blob:class{},FileReader:class{readAsText(file){this.result=file.text;this.onload();}},URL:{createObjectURL(){return 'blob:'},revokeObjectURL(){}},window:null};
  sandbox.window=sandbox;sandbox.scrollTo=()=>{};sandbox.confirm=()=>true;
  vm.createContext(sandbox);
  for(const source of sources)vm.runInContext(source,sandbox);
  const click=dataset=>document.onclick({target:{closest:()=>({dataset,tagName:'BUTTON'})},stopPropagation(){}});
  return {app:sandbox.TomEng,storage,document,click,html:()=>document.querySelector('#app').innerHTML};
}
const key='tomeng_native_v3';
const fresh=boot();
assert.equal(fresh.app.phraseCount,1200);
assert.equal(fresh.app.getState().activeSession.lessonId,'day-001');
fresh.click({action:'save',id:'p001'});
assert.equal(Object.keys(fresh.app.getState().completions).length,0);
fresh.click({action:'continue'});
for(let i=1;i<=5;i++){
  const id='p'+String(i).padStart(3,'0');
  fresh.click({action:'practice-mark',id,mark:'ready'});
  assert.equal(fresh.app.getState().activeSession.learnIndex,i-1,'cannot skip reveal');
  fresh.click({action:'reveal'});
  fresh.click({action:'practice-mark',id,mark:'ready'});
}
assert.equal(fresh.app.getState().activeSession.phase,'quick');
for(let i=1;i<=5;i++){
  const id='p'+String(i).padStart(3,'0');
  fresh.click({newRating:'good',id});
  assert.equal(fresh.app.getState().activeSession.recallIndex,i-1,'reveal alone is not a rating');
  fresh.click({action:'quick-reveal'});
  fresh.click({newRating:i===1?'again':'good',id});
}
assert.equal(Object.keys(fresh.app.getState().completions).length,1);
assert.equal(fresh.app.getState().activeSession,null,'one completed new lesson per calendar day');
assert.equal(fresh.app.getState().reviews.p001.dueDate,'2026-11-12','missed item due next day');
assert.equal(fresh.app.getState().streak,1);
assert.match(fresh.html(),/Hôm nay đã học xong/);
fresh.click({action:'continue'});
assert.equal(fresh.app.getState().activeSession,null);

const next=boot(Object.fromEntries(fresh.storage),'2026-11-12');
assert.equal(next.app.getState().activeSession.phase,'review');
assert.equal(next.app.getState().activeSession.reviewLessonId,'day-001');
next.click({action:'continue'});
for(let i=1;i<=5;i++){
  const id='p'+String(i).padStart(3,'0');
  next.click({rating:'good',id});
  assert.equal(next.app.getState().activeSession.reviewIndex,i-1,'cannot rate hidden answer');
  next.click({action:'reveal'});
  next.click({rating:'good',id});
}
assert.equal(next.app.getState().activeSession.phase,'learn');
assert.equal(next.app.getState().activeSession.reviewDone.length,5);
next.click({page:'rescue'});
next.click({intent:'cafe'});
assert.match(next.html(),/Can I get an iced latte/);
assert.equal((next.html().match(/class="rescue-card"/g)||[]).length,3);
next.document.oninput({target:{id:'global-search',value:'airport'}});
next.click({page:'library'});
assert.match(next.html(),/How do I get to the airport/);
next.click({action:'speed'});
assert.equal(next.app.getState().speechRate,.8);
assert.equal(next.app.getNextInterval({repetitions:0,interval:0},'good'),1);
assert.equal(next.app.getNextInterval({repetitions:1,interval:1},'good'),3);
assert.equal(next.app.getNextInterval({repetitions:2,interval:3},'good'),7);
assert.equal(next.app.getNextInterval({repetitions:3,interval:7},'good'),14);
assert.equal(next.app.getNextInterval({repetitions:4,interval:14},'good'),30);
assert.equal(next.app.shiftDate('2026-12-31',1),'2027-01-01');

const oldLearned=Array.from({length:50},(_,i)=>'p'+String(i+1).padStart(3,'0'));
const legacy=boot({'tomeng_notebook_v2':JSON.stringify({saved:['p001','p151'],learned:oldLearned,streak:30})});
assert.equal(legacy.app.getState().learned.length,50);
assert.equal(legacy.app.getState().saved[0],'p001');
assert.equal(legacy.app.getState().saved[1],'p152','V2 p151 maps by English fingerprint');
assert.equal(Object.keys(legacy.app.getState().completions).length,0,'learned count does not fabricate completed lessons');
assert.equal(legacy.app.getState().streak,0);
assert.ok(legacy.storage.has('tomeng_native_v3_migration_backup'));
assert.ok(legacy.storage.has('tomeng_notebook_v2'));

const v2engine=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:['p151','p999'],learned:['p151','p999'],reviews:{p151:{dueDate:'2026-11-12',interval:1,repetitions:1}},completions:{}})});
assert.equal(v2engine.app.getState().saved[0],'p152');
assert.equal(v2engine.app.getState().learned[0],'p152');
assert.equal(v2engine.app.getState().reviews.p152.interval,1);
assert.ok(v2engine.app.getState().migration.unresolvedIds.includes('p999') || v2engine.app.getState().saved.length===2);
const imported=boot();
const backup={app:'TomEng',schemaVersion:3,data:{schemaVersion:3,saved:['p151'],learned:['p151'],completions:{},reviews:{p151:{dueDate:'2026-11-12',interval:1,repetitions:1}}}};
imported.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify(backup)}]}});
assert.equal(imported.app.getState().saved[0],'p152');
assert.equal(imported.app.getState().reviews.p152.interval,1);
assert.ok([...imported.storage.keys()].some(k=>k.startsWith('tomeng_before_import_')));

const queueReviews={};for(let i=1;i<=20;i++)queueReviews['p'+String(i).padStart(3,'0')]={dueDate:'2000-01-01',repetitions:1,interval:1};
const queue=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions:{},reviews:queueReviews})});
queue.click({page:'due'});
assert.equal((queue.html().match(/class="due-card"/g)||[]).length,12);
const missed=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],streak:9,completions:{'day-001':{day:1,lessonId:'day-001',date:'2026-11-01'}},reviews:{}})});
assert.equal(missed.app.getState().streak,0,'missed calendar days reset streak');
assert.equal(missed.app.getState().activeSession.reviewLessonId,'day-001');

const completions={};for(let day=1;day<=30;day++)completions['day-'+String(day).padStart(3,'0')]={day,lessonId:'day-'+String(day).padStart(3,'0'),date:'2026-10-'+String(day).padStart(2,'0')};
const day31=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions,lastCompletedLessonId:'day-030'})});
assert.equal(day31.app.getState().activeSession.lessonId,'day-031');
for(let day=31;day<=240;day++)completions['day-'+String(day).padStart(3,'0')]={day,lessonId:'day-'+String(day).padStart(3,'0'),date:'2025-01-01'};
const done=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions,lastCompletedLessonId:'day-240'})});
assert.equal(done.app.getState().activeSession,null);
assert.match(done.html(),/Đã hoàn thành 240 trang/);
console.log('PASS: daily gate, previous-five review, reveal/rating guards, SRS, V2 fingerprint migration, Day 31/240 and due cap');
