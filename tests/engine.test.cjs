const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sources = ['legacy-v2-fingerprints.js','data.js','meta.js','legacy-lesson-plan-v3.js','legacy-lesson-plan-v3_1.js','app.js'].map(file => fs.readFileSync(path.join(root,file),'utf8'));
function boot(seed = {}, day = '2026-11-11', options = {}) {
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
  const sandbox={document,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{},location:{protocol:'file:',reload(){this.reloaded=true;}},console,setTimeout,clearTimeout,Intl,Date:ClockDate,Blob:class{},FileReader:class{readAsText(file){this.result=file.text;this.onload();}},URL:{createObjectURL(){return 'blob:'},revokeObjectURL(){}},window:null};
  if(options.speech){sandbox.speechSynthesis={cancel(){},getVoices(){return[]},speak(utterance){sandbox.lastUtterance=utterance;} };sandbox.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};}
  if(options.recognition){sandbox.SpeechRecognition=class{start(){if(options.recognition==='throw')throw new Error('permission denied');sandbox.lastRecognition=this;}stop(){}};}
  sandbox.window=sandbox;sandbox.scrollTo=()=>{};sandbox.confirm=()=>true;
  vm.createContext(sandbox);
  for(const source of sources)vm.runInContext(source,sandbox);
  const click=dataset=>document.onclick({target:{closest:()=>({dataset,tagName:'BUTTON'})},stopPropagation(){}});
  return {app:sandbox.TomEng,meta:sandbox.TOMENG_META,legacyPlans:[sandbox.TOMENG_LEGACY_LESSON_PLAN_V3_1,sandbox.TOMENG_LEGACY_LESSON_PLAN_V3],storage,document,click,html:()=>document.querySelector('#app').innerHTML,finishSpeech:()=>sandbox.lastUtterance?.onend?.(),recognitionResult:text=>sandbox.lastRecognition?.onresult?.({results:[[{transcript:text}]]}),recognitionError:error=>sandbox.lastRecognition?.onerror?.({error})};
}
const key='tomeng_native_v3';
const fresh=boot();
assert.equal(fresh.app.phraseCount,1200);
assert.equal(fresh.app.getState().activeSession.lessonId,'day-001');
assert.equal(fresh.app.getState().schemaVersion,5);
assert.match(sources[5],/navButton\('grammar','bulb'/);
assert.match(sources[5],/navButton\('rescue','lifebuoy'/);
assert.match(sources[5],/navButton\('due','clock'/);
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
assert.equal(fresh.app.getState().speakingPracticed.length,0,'manual self-report is not counted as successful speech recognition');
assert.equal(fresh.app.getState().selfReportedPractice.length,5,'explicit self-report is tracked separately');
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
legacy.click({page:'progress'});legacy.click({action:'rollback-migration'});assert.equal(legacy.storage.has(key),false,'rollback removes the migrated V3 key');assert.ok(legacy.storage.has('tomeng_notebook_v2'),'rollback restores the legacy V2 key from snapshot');assert.ok([...legacy.storage.keys()].some(k=>k.startsWith('tomeng_before_rollback_')),'rollback snapshots current progress before restoring legacy data');
const v1=boot({'speak5_data_v1':JSON.stringify({bookmarks:['p001','p151'],sessions:[{learned:['p002','p151']}]})});assert.ok(v1.app.getState().saved.includes('p001'));assert.ok(v1.app.getState().learned.includes('p002'));assert.ok(v1.storage.has('tomeng_native_v3_migration_backup'),'V1 migration receives a recoverable snapshot');

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

const oldCompletions={'day-001':{lessonId:'day-001',day:1,date:'2026-01-01'},'day-031':{lessonId:'day-031',day:31,date:'2026-02-01'},'day-240':{lessonId:'day-240',day:240,date:'2026-09-01'}};
const completionMigration=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:[],learned:['p151'],completions:oldCompletions})});
assert.ok(completionMigration.app.getState().completions['day-001'],'early lesson history is preserved in place');
assert.equal(completionMigration.app.getState().completions['day-031'],undefined,'reshuffled lesson progress is not falsely applied to different phrases');
assert.equal(Object.keys(completionMigration.app.getState().migration.archivedCompletions).length,2,'later lesson history remains in the migration archive');

const queueReviews={};for(let i=1;i<=20;i++)queueReviews['p'+String(i).padStart(3,'0')]={dueDate:'2000-01-01',repetitions:1,interval:1};
const queue=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],completions:{},reviews:queueReviews})});
queue.click({page:'due'});
assert.equal((queue.html().match(/class="due-card"/g)||[]).length,12);
const missed=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],streak:9,completions:{'day-001':{day:1,lessonId:'day-001',phraseIds:fresh.meta.lessons[0].phraseIds,date:'2026-11-01'}},reviews:{}})});
assert.equal(missed.app.getState().streak,0,'missed calendar days reset streak');
assert.equal(missed.app.getState().activeSession.reviewLessonId,'day-001');

const completions={};for(let day=1;day<=30;day++)completions['day-'+String(day).padStart(3,'0')]={day,lessonId:'day-'+String(day).padStart(3,'0'),date:'2026-10-'+String(day).padStart(2,'0')};
const day31=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],completions,lastCompletedLessonId:'day-030'})});
assert.equal(day31.app.getState().activeSession.lessonId,'day-031');

// A V3.1 plan update must archive incompatible lesson completion and preserve its phrase-level history.
const planMigrationSource=boot(),priorPlan=planMigrationSource.legacyPlans[0],originalPlan=planMigrationSource.legacyPlans[1];
const completedBeforeUpdate={};for(let day=1;day<=30;day++){const l=fresh.meta.lessons[day-1];completedBeforeUpdate[l.id]={day,lessonId:l.id,phraseIds:l.phraseIds,date:'2026-10-01'};}
completedBeforeUpdate['day-031']={day:31,lessonId:'day-031',date:'2026-10-02'};
const planMigrated=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:['p001'],learned:['p151'],speakingPracticed:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:1,repetitions:1}},completions:completedBeforeUpdate,lastCompletedLessonId:'day-031'})});
assert.equal(planMigrated.app.getState().completions['day-031'],undefined,'incompatible completion is not applied to a different five-phrase lesson');
assert.ok(planMigrated.app.getState().migration.archivedCompletions['day-031'].possiblePhraseIdsByPlan['native-v3'].length===5,'ambiguous old plan candidates are preserved in migration archive');
assert.ok(planMigrated.app.getState().saved.includes('p001'));
assert.ok(planMigrated.app.getState().learned.includes('p151'));
assert.equal(planMigrated.app.getState().reviews.p151.interval,1);
assert.ok(planMigrated.app.getState().selfReportedPractice.includes('p151'),'legacy practice marks are retained transparently');
assert.ok([...planMigrated.storage.keys()].some(k=>k.startsWith('tomeng_plan_migration_backup_')));
const preMigration=JSON.parse(planMigrated.storage.get('tomeng_native_v3'));planMigrated.click({page:'progress'});planMigrated.click({action:'rollback-migration'});assert.equal(JSON.parse(planMigrated.storage.get(key)).contentVersion,'native-v3.1','rollback restores the exact store captured before the plan migration');assert.ok([...planMigrated.storage.keys()].some(k=>k.startsWith('tomeng_before_rollback_')));
const oldActive={lessonId:'day-031',phase:'quick',learnIndex:5,learnedViewed:[...originalPlan.lessons[30].phraseIds],reviewLessonId:'day-030',reviewIndex:5,reviewDone:[...originalPlan.lessons[29].phraseIds],recallIndex:0,recallDone:[]};
const activeMigration=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions:completedBeforeUpdate,lastCompletedLessonId:'day-030',activeSession:oldActive})});
const legacySequence=activeMigration.legacyPlans[1];
assert.deepEqual(activeMigration.app.getState().activeSession.phraseIds,legacySequence.lessons[30].phraseIds,'unfinished lesson resumes with its legacy phrase order');
assert.deepEqual(activeMigration.app.getState().activeSession.reviewPhraseIds,legacySequence.lessons[29].phraseIds,'unfinished review resumes with its legacy review snapshot');
assert.equal(activeMigration.app.getState().activeSession.learnedViewed[0],'p151');
activeMigration.click({action:'continue'});for(const id of legacySequence.lessons[30].phraseIds){activeMigration.click({action:'quick-reveal'});activeMigration.click({newRating:'good',id});}assert.equal(activeMigration.app.getState().completions['day-031'],undefined,'finishing a preserved legacy session does not complete the reshuffled lesson');assert.equal(activeMigration.app.getState().migration.archivedCompletions['day-031'].archivedReason,'completed-preserved-legacy-session');assert.equal(activeMigration.app.getState().activeSession,null,'legacy session can finish and keeps the one-lesson-per-day cap');

// Exercise every track transition; all five review IDs must belong to the actual completed lesson.
for(const selectedTrack of ['everyday','workplace','mixed']){
  const route=fresh.meta.lessons.filter(l=>selectedTrack==='mixed'||(selectedTrack==='everyday'?l.primaryCategoryId==='everyday'||l.primaryCategoryId==='reflex':l.primaryCategoryId!=='everyday'&&l.primaryCategoryId!=='reflex'));
  for(let index=1;index<route.length;index++){
    const previous=route[index-1],current=route[index],priorCompletions={};
    for(let j=0;j<index;j++){const l=route[j];priorCompletions[l.id]={lessonId:l.id,day:l.day,phraseIds:l.phraseIds,date:'2026-11-10'};}
    const state=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',track:selectedTrack,saved:[],learned:[],completions:priorCompletions,lastCompletedLessonId:previous.id})});
    const session=state.app.getState().activeSession;
    assert.equal(session.lessonId,current.id,`${selectedTrack} transition ${index} selects the next lesson`);
    assert.equal(session.reviewLessonId,previous.id,`${selectedTrack} transition ${index} reviews the last completed lesson`);
    assert.equal(JSON.stringify(session.reviewPhraseIds),JSON.stringify(priorCompletions[previous.id].phraseIds),`${selectedTrack} transition ${index} uses the completed phrase snapshot`);
    state.click({action:'continue'});
    for(const id of session.reviewPhraseIds){state.click({action:'reveal'});state.click({rating:'good',id});}
    assert.equal(state.app.getState().activeSession.phase,'learn',`${selectedTrack} transition ${index} unlocks new phrases after all five reviews`);
  }
}

for(let day=31;day<=240;day++)completions['day-'+String(day).padStart(3,'0')]={day,lessonId:'day-'+String(day).padStart(3,'0'),date:'2025-01-01'};
const done=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],completions,lastCompletedLessonId:'day-240'})});
assert.equal(done.app.getState().activeSession,null);
assert.match(done.html(),/Đã hoàn thành 240 trang/);
const track=boot();track.click({track:'workplace'});assert.equal(track.app.getState().track,'workplace','track selector is wired and persisted');const workplaceLesson=track.meta.lessons.find(l=>l.primaryCategoryId!=='everyday'&&l.primaryCategoryId!=='reflex');assert.equal(track.app.getState().activeSession.lessonId,workplaceLesson.id,'untouched session follows the selected track');assert.equal(boot(Object.fromEntries(track.storage)).app.getState().track,'workplace','track choice persists across reload');
track.click({page:'more'});assert.match(track.html(),/data-page="grammar"/);assert.match(track.html(),/data-page="saved"/);assert.match(track.html(),/data-page="progress"/);
const library=boot();library.click({page:'library'});assert.equal((library.html().match(/class="phrase-card"/g)||[]).length,60,'library renders a bounded first page');library.click({action:'library-more'});assert.equal((library.html().match(/class="phrase-card"/g)||[]).length,120,'library load-more appends a bounded page');
track.click({page:'rescue'});track.document.oninput({target:{id:'rescue-search',value:'airport'}});assert.match(track.html(),/airport/i,'Rescue Mode searches arbitrary situations across the library');
track.click({page:'listening'});assert.match(track.html(),/disabled/);track.click({action:'listening-play'});assert.match(track.html(),/disabled/,'unsupported TTS does not unlock transcript');
const listener=boot({},'2026-11-11',{speech:true});listener.click({page:'listening'});assert.doesNotMatch(listener.html(),/class="answer-box"/);listener.click({action:'listening-play'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'listening does not reveal the answer');listener.click({action:'listening-reveal'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'transcript stays locked while audio is playing');listener.finishSpeech();listener.click({action:'listening-reveal'});assert.match(listener.html(),/class="answer-box"/,'transcript appears only after audio and self-check');listener.click({action:'listening-next'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'next item clears revealed transcript');
const noMic=boot();noMic.click({action:'mic',id:'p001'});assert.equal(noMic.app.getState().speakingPracticed.length,0,'unsupported microphone does not count as speaking practice');
const failedMic=boot({},'2026-11-11',{recognition:'throw'});failedMic.click({action:'mic',id:'p001'});assert.equal(failedMic.app.getState().speakingPracticed.length,0,'microphone start failure does not count as speaking practice');
const mic=boot({},'2026-11-11',{recognition:true});mic.click({action:'mic',id:'p001'});mic.recognitionError('not-allowed');assert.equal(mic.app.getState().speakingPracticed.length,0,'permission failure does not count as speaking practice');mic.click({action:'mic',id:'p001'});mic.recognitionResult('I am concerned about it');assert.equal(mic.app.getState().speakingPracticed.join(','),'p001','nonempty recognition result is recorded as a practice attempt, not a pronunciation score');
track.click({page:'conversation'});assert.match(track.html(),/Hội thoại mẫu 2 lượt/);track.click({action:'reveal'});assert.match(track.html(),/Người đối diện/);track.click({action:'conversation-next'});assert.match(track.html(),/Hội thoại mẫu 2 lượt/);
console.log('PASS: daily review/learn/recall, track/rescue search, Listening transcript gate, Speaking success/error accounting, SRS, V1/V2 migration, progress archive/rollback, 240 lessons and review cap');
