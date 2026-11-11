const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sources = ['legacy-v2-fingerprints.js','data.js','meta.js','legacy-lesson-plan-v3.js','legacy-lesson-plan-v3_1.js','legacy-lesson-plan-v3_2.js','legacy-lesson-plan-v3_3.js','app.js'].map(file => fs.readFileSync(path.join(root,file),'utf8'));
const appSource=sources.at(-1);
function boot(seed = {}, day = '2026-11-11', options = {}) {
  const storage = new Map(Object.entries(seed));
  const elements = new Map();
  const windowEvents={};let lastBlob='';
  let currentDay=day;
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [currentDay+'T12:00:00'])); }
    static now() { return new Date(currentDay+'T12:00:00').getTime(); }
  }
  const document = {
    activeElement:null,
    querySelector(selector) { if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},setSelectionRange(){},querySelector(){return null},querySelectorAll(){return []},getClientRects(){return []}});return elements.get(selector); },
    addEventListener(type,fn) { this['on'+type]=fn; },
    createElement() { return {click(){},set href(v){},set download(v){}}; }
  };
  const sandbox={document,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>{if(options.dropWrites&&k==='tomeng_native_v3')return;if(options.failWrites&&k==='tomeng_native_v3')throw new Error('quota');if(options.failBackupWrite&&k.startsWith('tomeng_before_import_'))throw new Error('quota');if(options.failPlanBackup&&k.startsWith('tomeng_plan_migration_backup_'))throw new Error('quota');if(options.failLegacyBackup&&k==='tomeng_native_v3_migration_backup')throw new Error('quota');if(options.failImportDestination&&k==='tomeng_native_v3'&&String(v).includes('"saved":["p151"]'))throw new Error('quota');if(options.failMigrationDestination&&k==='tomeng_native_v3'&&String(v).includes('"contentVersion":"native-v3.4"')&&String(v).includes('"contentPlanUpdatedFrom"'))throw new Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)},navigator:{},location:{protocol:'file:',reload(){this.reloaded=true;}},console,setTimeout,clearTimeout,Intl,Date:ClockDate,Blob:class{constructor(parts){lastBlob=parts.join('');}},FileReader:class{readAsText(file){this.result=file.text;this.onload();}},URL:{createObjectURL(){return 'blob:'},revokeObjectURL(){}},window:null};
  if(options.speech){sandbox.speechSynthesis={cancel(){},getVoices(){return[]},speak(utterance){sandbox.lastUtterance=utterance;} };sandbox.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};}
  if(options.recognition){sandbox.SpeechRecognition=class{start(){if(options.recognition==='throw')throw new Error('permission denied');sandbox.lastRecognition=this;}stop(){}};}
  sandbox.window=sandbox;sandbox.scrollTo=()=>{};sandbox.confirm=()=>true;sandbox.addEventListener=(name,fn)=>windowEvents[name]=fn;
  vm.createContext(sandbox);
  for(const source of sources)vm.runInContext(source,sandbox);
  const click=dataset=>document.onclick({target:{closest:()=>({dataset,tagName:'BUTTON'})},stopPropagation(){}});
  return {app:sandbox.TomEng,meta:sandbox.TOMENG_META,phrases:sandbox.SPEAK5_PHRASES,legacyPlans:[sandbox.TOMENG_LEGACY_LESSON_PLAN_V3_3,sandbox.TOMENG_LEGACY_LESSON_PLAN_V3_2,sandbox.TOMENG_LEGACY_LESSON_PLAN_V3_1,sandbox.TOMENG_LEGACY_LESSON_PLAN_V3],storage,document,click,setDate:value=>{currentDay=value;},html:()=>document.querySelector('#app').innerHTML,modalHtml:()=>document.querySelector('#modal-root').innerHTML,toast:()=>document.querySelector('#toast').textContent,downloaded:()=>lastBlob,restoreStorage:()=>{options.failWrites=false;},triggerBeforeUnload:()=>{let prevented=false;const event={preventDefault(){prevented=true;},returnValue:undefined};windowEvents.beforeunload?.(event);return {prevented,returnValue:event.returnValue};},finishSpeech:()=>sandbox.lastUtterance?.onend?.(),recognitionResult:text=>sandbox.lastRecognition?.onresult?.({results:[[{transcript:text}]]}),recognitionError:error=>sandbox.lastRecognition?.onerror?.({error})};
}
const key='tomeng_native_v3';
const fresh=boot();
assert.equal(fresh.app.phraseCount,1200);
assert.equal(fresh.app.getState().activeSession.lessonId,'day-001');
assert.equal(fresh.app.getState().schemaVersion,7);
assert.equal(fresh.app.getState().contentVersion,'native-v3.4','scenario curriculum has its own content version');
assert.equal(fresh.app.getState().introducedPhraseIds.length,0,'clean account starts with zero introduced phrase IDs');assert.equal(fresh.app.getState().activeSession.phraseIds.length,5);assert.equal(fresh.app.getState().activeSession.newPhraseIds.length,5,'first day with no prior phrases starts with five new');assert.equal(fresh.app.getState().activeSession.reusePhraseIds.length,0,'first day has no reuse when no old phrase exists');
assert.match(fresh.html(),/0 \/ 1200 cụm/,'Home progress begins at zero unique introduced IDs');
assert.equal(fresh.app.appVersion,'3.4.1','single app version source is exposed by runtime');
assert.equal((fresh.html().match(/data-app-version=\"3\.4\.1\"/g)||[]).length,2,'desktop and compact header labels render the same app version');
assert.match(fresh.html(),/v3\.4\.1/);
assert.doesNotMatch(fresh.html(),/undefined/,'version label never renders undefined');
assert.match(appSource,/navButton\('grammar','bulb'/);
assert.match(appSource,/navButton\('rescue','lifebuoy'/);
assert.match(appSource,/navButton\('due','clock'/);
const filterUi=boot();
filterUi.click({page:'library'});
let filterUiHtml=filterUi.html();
assert.match(filterUiHtml,/role="group" aria-label="Chế độ xem nội dung"/,'view mode is a separate labeled segmented control');
assert.match(filterUiHtml,/aria-label="Danh mục chính"/,'primary category tabs have their own navigation label');
assert.match(filterUiHtml,/aria-labelledby="subcategory-panel-title"/,'subcategories have a separate panel and heading');
assert.equal((filterUiHtml.match(/class="subcategory-group"/g)||[]).length,7,'All shows subcategories grouped under all seven category headings');
assert.equal((filterUiHtml.match(/class="subcategory-chip /g)||[]).length,70,'All keeps all seventy subcategory choices visible');
assert.match(filterUiHtml,/1\.200<\/strong> cụm từ/,'All results count reflects the full phrase collection');
filterUi.click({filter:'everyday'});
filterUiHtml=filterUi.html();
assert.equal((filterUiHtml.match(/class="subcategory-group"/g)||[]).length,1,'selecting a category leaves only its own subcategory section');
assert.equal((filterUiHtml.match(/class="subcategory-chip /g)||[]).length,20,'Everyday contains only its own twenty subcategories');
assert.match(filterUiHtml,/class="category-tab selected" data-filter="everyday" aria-current="page"/,'selected primary category has a distinct current state');
const everydaySub=filterUi.meta.subcategories.find(sub=>sub.categoryId==='everyday');
filterUi.click({subfilter:everydaySub.id});
filterUiHtml=filterUi.html();
assert.equal(filterUiHtml.includes(`<strong>${everydaySub.count}</strong> cụm từ`),true,'subcategory selection updates result count');
assert.match(filterUiHtml,new RegExp(`data-subfilter="${everydaySub.id}" aria-pressed="true"`),'selected subcategory exposes pressed state');
filterUi.click({viewMode:'patterns'});
filterUiHtml=filterUi.html();
assert.match(filterUiHtml,/data-view-mode="patterns" aria-pressed="true"/,'pattern view mode updates without changing filters');
assert.match(filterUiHtml,new RegExp(`data-subfilter="${everydaySub.id}" aria-pressed="true"`),'view mode change preserves selected subcategory');
filterUi.click({filter:'all'});
filterUiHtml=filterUi.html();
assert.equal((filterUiHtml.match(/class="subcategory-group"/g)||[]).length,7,'returning to All restores grouped subcategory access');
assert.equal((filterUiHtml.match(/class="subcategory-chip /g)||[]).length,70);
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
assert.equal(fresh.app.getState().activeSession.phase,'apply','Recall 5 leads to the scenario application task');
assert.equal(Object.keys(fresh.app.getState().completions).length,0,'a lesson cannot complete before its scenario task is attempted');
assert.match(fresh.html(),/Nhiệm vụ nói/);
assert.match(fresh.html(),/5 câu/);assert.match(fresh.html(),/Mới/,'scenario application and learning cards label new phrases explicitly');
fresh.click({action:'scenario-complete'});
assert.equal(Object.keys(fresh.app.getState().completions).length,1);
assert.equal(fresh.app.getState().introducedPhraseIds.length,5,'only completing Learn, Recall and application introduces exactly five IDs');assert.equal(fresh.app.getState().sessions[0].introducedCount,5);assert.equal(fresh.app.getState().sessions[0].reusePhraseIds.length,0);assert.equal(fresh.app.getState().sessions[0].scenarioSnapshot.steps.length,5);
assert.match(fresh.html(),/5 \/ 1200 cụm/,'Home progress counts the first five unique phrase IDs');
assert.equal(fresh.app.getState().activeSession,null,'one completed new lesson per calendar day');
assert.equal(fresh.app.getState().reviews.p001.dueDate,'2026-11-12','missed item due next day');
assert.equal(fresh.app.getState().streak,1);
assert.match(fresh.html(),/Hôm nay đã học xong/);assert.match(fresh.html(),/1 buổi đã hoàn tất/);assert.doesNotMatch(fresh.html(),/1 \/ 260/,'Home session count has no static lesson denominator');
const priorFive=['p001','p002','p003','p004','p005'],threeNew=['p151','p159','p168'],threeNewPhrases=[...threeNew,...priorFive.slice(0,2)],ratioLesson=fresh.meta.lessons[30],ratioSteps=threeNewPhrases.map((id,index)=>({phraseId:id,kind:threeNew.includes(id)?'new':'reuse',intent:`Lượt ${index+1}`,cue:'Dùng lượt này trong cùng tình huống.'}));
const ratioFixture=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',track:'mixed',introducedPhraseIds:priorFive,sessions:[{lessonId:'day-001',date:'2026-11-09',phraseIds:priorFive.slice(0,3),newPhraseIds:priorFive.slice(0,3),introducedCount:3,applicationPracticed:true},{lessonId:'day-002',date:'2026-11-10',phraseIds:priorFive.slice(3),newPhraseIds:priorFive.slice(3),introducedCount:2,applicationPracticed:true}],completions:{},reviews:{},activeSession:{lessonId:'day-031',phraseIds:threeNewPhrases,candidatePhraseIds:threeNew,newPhraseIds:threeNew,reusePhraseIds:priorFive.slice(0,2),reinforcementPhraseIds:priorFive.slice(0,2),scenarioSnapshot:{...ratioLesson,candidatePhraseIds:threeNew,reusePhraseIds:priorFive.slice(0,2),steps:ratioSteps},planVersion:'native-v3.4',phase:'apply',reviewPhraseIds:[],reviewDone:[],recallDone:threeNewPhrases,learnedViewed:threeNewPhrases,applicationPracticed:false}})});
ratioFixture.click({action:'scenario-complete'});assert.equal(ratioFixture.app.getState().introducedPhraseIds.length,8,'a 3 NEW + 2 REUSE session advances unique progress from five to eight');assert.equal(ratioFixture.app.getState().sessions.at(-1).introducedCount,3);assert.match(ratioFixture.html(),/8 \/ 1200 cụm/,'Home progress counts only the three new IDs in a mixed session');assert.match(ratioFixture.html(),/3 buổi đã hoàn tất/,'Home secondary progress counts real completed sessions without a 240-day denominator');
const adaptiveBaseIds=Array.from({length:150},(_,index)=>'p'+String(index+1).padStart(3,'0')),adaptiveLesson=fresh.meta.lessons[30],adaptiveFamily=fresh.meta.lessons.filter(item=>item.familyId===adaptiveLesson.familyId),adaptiveCandidateSet=new Set(adaptiveLesson.candidatePhraseIds),adaptivePatterns=new Set(adaptiveLesson.phraseIds.map(id=>fresh.phrases.find(phrase=>phrase.id===id).patternId)),adaptiveOldIds=[];
for(const id of [...new Set(adaptiveFamily.flatMap(item=>item.phraseIds))]){const phrase=fresh.phrases.find(item=>item.id===id);if(!adaptiveBaseIds.includes(id)&&!adaptiveCandidateSet.has(id)&&!adaptivePatterns.has(phrase.patternId)&&!adaptiveOldIds.some(old=>fresh.phrases.find(item=>item.id===old).patternId===phrase.patternId))adaptiveOldIds.push(id);if(adaptiveOldIds.length===3)break;}
assert.equal(adaptiveOldIds.length,3,'scenario family has three distinct previously learnable support patterns');
const adaptiveCandidateIds=[...adaptiveCandidateSet];assert.equal(adaptiveCandidateIds.length,5);
const priorAdaptiveSnapshot=[...adaptiveCandidateIds.slice(0,3),...adaptiveOldIds.slice(0,2)],lastAdaptiveSnapshot=[...adaptiveCandidateIds.slice(3),...adaptiveOldIds];
const adaptiveCompletionFixture=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',track:'mixed',introducedPhraseIds:[...adaptiveBaseIds,...adaptiveCandidateIds.slice(0,3),...adaptiveOldIds],sessions:[{lessonId:adaptiveLesson.id,date:'2026-11-10',completedAt:'2026-11-10T12:00:00.000Z',sessionSequence:1,phraseIds:priorAdaptiveSnapshot,practicedPhraseIds:priorAdaptiveSnapshot,newPhraseIds:adaptiveCandidateIds.slice(0,3),reusePhraseIds:adaptiveOldIds.slice(0,2),introducedCount:3,applicationPracticed:true}],completions:{},reviews:{},activeSession:{lessonId:adaptiveLesson.id,phraseIds:lastAdaptiveSnapshot,candidatePhraseIds:adaptiveCandidateIds.slice(3),newPhraseIds:adaptiveCandidateIds.slice(3),reusePhraseIds:adaptiveOldIds,reinforcementPhraseIds:adaptiveOldIds,scenarioSnapshot:{...adaptiveLesson,candidatePhraseIds:adaptiveCandidateIds.slice(3),reusePhraseIds:adaptiveOldIds,steps:lastAdaptiveSnapshot.map((phraseId,turn)=>({phraseId,turn:turn+1,kind:adaptiveCandidateIds.slice(3).includes(phraseId)?'new':'reuse',intent:`Lượt ${turn+1}`,cue:'Nối tiếp đúng tình huống.'}))},planVersion:'native-v3.4',phase:'apply',reviewPhraseIds:[],reviewDone:[],recallDone:lastAdaptiveSnapshot,learnedViewed:lastAdaptiveSnapshot,applicationPracticed:false}})});
adaptiveCompletionFixture.click({action:'scenario-complete'});
const adaptiveFinished=JSON.parse(adaptiveCompletionFixture.storage.get(key)),adaptiveCompletion=adaptiveFinished.completions[adaptiveLesson.id],lastStoredSession=adaptiveFinished.sessions.at(-1);
assert.deepEqual(adaptiveFinished.introducedPhraseIds.filter(id=>adaptiveCandidateIds.includes(id)).sort(),adaptiveCandidateIds.slice().sort(),'same scenario completes only after its five candidate IDs were introduced across the 3+2 and 2+3 sessions');
assert.deepEqual(adaptiveCompletion.catalogCandidatePhraseIds,adaptiveCandidateIds,'completion clearly stores catalog candidate membership');
assert.deepEqual(adaptiveCompletion.practicedPhraseIds,lastAdaptiveSnapshot,'completion stores the actual five IDs practiced in the final 2 NEW + 3 REUSE session');
assert.equal(Object.hasOwn(adaptiveCompletion,'phraseIds'),false,'new completion records do not label a static catalog set as the actual session');
assert.equal(adaptiveCompletion.completedAt,lastStoredSession.completedAt,'completion and session share one authoritative timestamp');
assert.equal(adaptiveCompletion.sessionSequence,lastStoredSession.sessionSequence,'completion references its deterministic session sequence');
// Recreate a pre-fix completion that contains only the static catalog set at the exact same timestamp.
adaptiveFinished.completions[adaptiveLesson.id]={lessonId:adaptiveLesson.id,day:adaptiveLesson.day,phraseIds:[...adaptiveLesson.phraseIds],newPhraseIds:[...adaptiveCandidateIds],planVersion:'native-v3.4',scenarioId:adaptiveLesson.scenarioId,date:lastStoredSession.date,completedAt:lastStoredSession.completedAt};
adaptiveCompletionFixture.storage.set(key,JSON.stringify(adaptiveFinished));
const afterAdaptiveDay=boot(Object.fromEntries(adaptiveCompletionFixture.storage),'2026-11-12'),reviewedAdaptive=afterAdaptiveDay.app.getState().activeSession;
assert.equal(reviewedAdaptive.reviewSnapshotSource,'session','same-timestamp completion tie resolves to the actual session log');
assert.equal(reviewedAdaptive.reviewLessonId,adaptiveLesson.id,'review points at the lesson used by both adaptive sessions');
assert.equal(JSON.stringify(reviewedAdaptive.reviewPhraseIds),JSON.stringify(lastAdaptiveSnapshot.filter(id=>!reviewedAdaptive.phraseIds.includes(id)).slice(0,5)),'next-day review is the actual final session snapshot minus intentional overlap with today’s scenario');
assert.ok(reviewedAdaptive.reviewPhraseIds.every(id=>lastAdaptiveSnapshot.includes(id)),'catalog-only phrase IDs never leak into the next-day review');
const switchedAdaptive=boot(Object.fromEntries(adaptiveCompletionFixture.storage),'2026-11-12');switchedAdaptive.click({track:'workplace'});
assert.equal(switchedAdaptive.app.getState().track,'workplace');
const switchedExpected=lastAdaptiveSnapshot.filter(id=>!switchedAdaptive.app.getState().activeSession.phraseIds.includes(id)).slice(0,5);
assert.equal(JSON.stringify(switchedAdaptive.app.getState().activeSession.reviewPhraseIds),JSON.stringify(switchedExpected),'track switch keeps the previous actual session snapshot and excludes only current-scenario overlap');
const droppedAdaptiveDay=boot(Object.fromEntries(switchedAdaptive.storage),'2026-11-22');
assert.equal(JSON.stringify(droppedAdaptiveDay.app.getState().activeSession.reviewPhraseIds),JSON.stringify(switchedAdaptive.app.getState().activeSession.reviewPhraseIds),'refresh after skipped days preserves the review snapshot already reserved for the unfinished session');
const allocateWithPressure=pressureCount=>{const reviews=Object.fromEntries(adaptiveOldIds.slice(0,pressureCount).map(id=>[id,{dueDate:'2026-11-11',lastRating:'hard'}]));const sample=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',track:'mixed',introducedPhraseIds:[...adaptiveBaseIds,...adaptiveOldIds],completions:{},sessions:[],reviews,activeSession:null})});return sample.app.getState().activeSession;};
for(const [pressure,newCount,reuseCount] of [[0,3,2],[1,4,1],[2,2,3]]){const allocation=allocateWithPressure(pressure);assert.equal(allocation.newPhraseIds.length,newCount,`${pressure} due or weak phrases adapts the new count for an appropriate scenario`);assert.equal(allocation.reusePhraseIds.length,reuseCount);assert.equal(allocation.phraseIds.length,5);}
const legacyResumeIds=['p001','p002','p003','p004','p005'],legacyResume=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',introducedPhraseIds:legacyResumeIds,completions:{},sessions:[],reviews:{},activeSession:{lessonId:'day-001',planVersion:'native-v3.2',phraseIds:legacyResumeIds,candidatePhraseIds:[],newPhraseIds:[],reusePhraseIds:legacyResumeIds,reinforcementPhraseIds:legacyResumeIds,scenarioSnapshot:{candidatePhraseIds:[],reusePhraseIds:legacyResumeIds,steps:legacyResumeIds.map((phraseId,turn)=>({phraseId,turn:turn+1,kind:'reuse',intent:'Luyện lại',cue:'Ôn câu cũ'}))},phase:'apply',reviewPhraseIds:[],reviewDone:[],recallDone:legacyResumeIds,learnedViewed:legacyResumeIds,applicationPracticed:false}})});assert.equal(legacyResume.app.getState().activeSession.newPhraseIds.length,0,'a resumed legacy snapshot keeps already-introduced IDs as REUSE');legacyResume.click({action:'scenario-complete'});assert.equal(legacyResume.app.getState().introducedPhraseIds.length,5,'a preserved legacy session does not increase unique progress');assert.equal(legacyResume.app.getState().sessions.at(-1).introducedCount,0,'resumed legacy completion records no false NEW IDs');assert.equal(legacyResume.app.getState().sessions.at(-1).reusePhraseIds.length,5);
fresh.click({action:'continue'});
assert.equal(fresh.app.getState().activeSession,null);

const next=boot(Object.fromEntries(fresh.storage),'2026-11-12');
assert.equal(next.app.getState().activeSession.phase,'review');assert.ok(next.app.getState().activeSession.reviewPhraseIds.length<=5);assert.equal(next.app.getState().activeSession.reviewPhraseIds.some((id)=>next.app.getState().activeSession.phraseIds.includes(id)),false,'warm-up never rates an ID that will also be reused in the scenario');
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
assert.equal(next.app.getState().introducedPhraseIds.length,5,'review and track-independent SRS do not increase new-phrase coverage');
assert.equal(next.app.getState().activeSession.reinforcementPhraseIds.length,0,'unrelated prior phrases are not forced into a new scenario');
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
const importBackup=payload=>{const target=boot();target.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify(payload)}]}});return target.app.getState();};
const backupPhraseEdit={en:'Edited backup phrase',vi:'Câu đã sửa trong bản sao lưu',context:'In a preserved context',follow:'This follow-up stays with it.'};
const v2Import=importBackup({app:'TomEng',schemaVersion:3,data:{schemaVersion:3,saved:['p151'],learned:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:3,repetitions:2}},contentEdits:{p151:backupPhraseEdit},completions:{'day-001':{day:1,lessonId:'day-001',date:'2026-11-10'},'day-031':{day:31,lessonId:'day-031',date:'2026-11-10'},'day-032':{day:32,lessonId:'day-032',date:'2026-11-10'}},sessions:[{lessonId:'day-001',date:'2026-11-10'}],activeSession:{lessonId:'day-031',phase:'learn',learnIndex:1,learnedViewed:['p151'],reviewLessonId:'day-030',reviewIndex:0,reviewDone:[]}}});
assert.equal(JSON.stringify(v2Import.saved),JSON.stringify(['p152']),'V2 schema uses V2 English fingerprints');assert.equal(JSON.stringify(v2Import.learned),JSON.stringify(['p152']));assert.equal(v2Import.reviews.p152.interval,3);assert.equal(v2Import.contentEdits.p152.en,backupPhraseEdit.en);assert.ok(v2Import.completions['day-001']);assert.equal(v2Import.sessions.length,1);assert.ok(v2Import.activeSession.phraseIds.includes('p152'));assert.ok(v2Import.migration.archivedCompletions['day-031']);
const planForVersion=version=>fresh.legacyPlans.find(plan=>plan.version===version);
const nativeV3Plan=planForVersion('native-v3'),nativeV31Plan=planForVersion('native-v3.1'),nativeV32Plan=planForVersion('native-v3.2'),nativeV33Plan=planForVersion('native-v3.3');
const nativeBackupBase={saved:['p151'],learned:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:7,repetitions:3}},contentEdits:{p151:backupPhraseEdit},completions:{'day-001':{day:1,lessonId:'day-001',date:'2026-11-10'},'day-031':{day:31,lessonId:'day-031',date:'2026-11-10'},'day-032':{day:32,lessonId:'day-032',date:'2026-11-11'}},sessions:[{lessonId:'day-001',date:'2026-11-10'}]};
const v3Import=importBackup({app:'TomEng',schemaVersion:4,contentVersion:'native-v3',data:{...nativeBackupBase,schemaVersion:4,contentVersion:'native-v3',activeSession:{lessonId:'day-032',phase:'review',reviewLessonId:'day-031',reviewIndex:2,reviewDone:nativeV3Plan.lessons[30].phraseIds.slice(0,2)}}});
assert.equal(JSON.stringify(v3Import.saved),JSON.stringify(['p151']),'V3 phrase ID p151 is preserved, not mapped through V2 fingerprints');assert.equal(JSON.stringify(v3Import.learned),JSON.stringify(['p151']));assert.equal(v3Import.reviews.p151.interval,7);assert.equal(v3Import.contentEdits.p151.en,backupPhraseEdit.en);assert.ok(v3Import.completions['day-001']);assert.equal(v3Import.completions['day-031'],undefined);assert.equal(JSON.stringify(v3Import.migration.archivedCompletions['day-031'].catalogCandidatePhraseIds),JSON.stringify(nativeV3Plan.lessons[30].phraseIds));assert.equal(JSON.stringify(v3Import.activeSession.phraseIds),JSON.stringify(nativeV3Plan.lessons[31].phraseIds));assert.equal(JSON.stringify(v3Import.activeSession.reviewPhraseIds),JSON.stringify(nativeV3Plan.lessons[30].phraseIds));assert.equal(v3Import.sessions.length,1);
const v31Import=importBackup({app:'TomEng',schemaVersion:4,contentVersion:'native-v3.1',data:{...nativeBackupBase,schemaVersion:4,contentVersion:'native-v3.1'}});
assert.equal(JSON.stringify(v31Import.saved),JSON.stringify(['p151']),'V3.1 backup keeps p151');assert.equal(JSON.stringify(v31Import.learned),JSON.stringify(['p151']));assert.equal(v31Import.reviews.p151.interval,7);assert.equal(v31Import.contentEdits.p151.en,backupPhraseEdit.en);assert.ok(v31Import.completions['day-001'],'unchanged V3.1 lesson membership stays completed');assert.equal(v31Import.completions['day-031'],undefined,'changed V3.1 scenario membership is not treated as completion of the new scenario');assert.equal(JSON.stringify(v31Import.migration.archivedCompletions['day-031'].catalogCandidatePhraseIds),JSON.stringify(nativeV31Plan.lessons[30].phraseIds));assert.ok(nativeV31Plan.lessons[30].phraseIds.every(id=>v31Import.introducedPhraseIds.includes(id)),'archived completion preserves unique introduced-phrase evidence');assert.equal(v31Import.completions['day-032'],undefined,'V3.1 completion with changed phrase membership is archived');assert.ok(v31Import.migration.archivedCompletions['day-032']);
const v32Data={schemaVersion:5,contentVersion:'native-v3.2',saved:['p151'],learned:['p151'],selfReportedPractice:['p151'],speakingPracticed:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:14,repetitions:4}},contentEdits:{p151:backupPhraseEdit},activityDates:['2026-11-09'],streak:4,completions:{'day-031':{day:31,lessonId:'day-031',phraseIds:nativeV32Plan.lessons[30].phraseIds,planVersion:'native-v3.2',date:'2026-11-10'},'day-032':{day:32,lessonId:'day-032',phraseIds:nativeV32Plan.lessons[31].phraseIds,planVersion:'native-v3.2',date:'2026-11-11'}},sessions:[{lessonId:'day-031',date:'2026-11-10'}],activeSession:{lessonId:'day-032',phase:'learn',phraseIds:nativeV32Plan.lessons[31].phraseIds,reviewPhraseIds:nativeV32Plan.lessons[30].phraseIds,reviewLessonId:'day-031',reviewIndex:1,reviewDone:['p151'],learnIndex:2,learnedViewed:['p345'],recallIndex:0,recallDone:[]},track:'workplace'};
const v32Import=importBackup({app:'TomEng',schemaVersion:5,contentVersion:'native-v3.2',data:v32Data});
assert.equal(JSON.stringify(v32Import.saved),JSON.stringify(['p151']));assert.equal(JSON.stringify(v32Import.learned),JSON.stringify(['p151']));assert.equal(JSON.stringify(v32Import.selfReportedPractice),JSON.stringify(['p151']));assert.equal(JSON.stringify(v32Import.speakingPracticed),JSON.stringify([]),'speech-to-text history remains a separate legacy metric');assert.equal(JSON.stringify(v32Import.sessions[0].phraseIds),undefined,'V3.2 import does not invent an actual session snapshot from its completion catalog');assert.equal(v32Import.reviews.p151.interval,14);assert.equal(v32Import.contentEdits.p151.en,backupPhraseEdit.en);assert.equal(v32Import.completions['day-031'],undefined,'changed V3.2 scenario membership is archived, not falsely attached to the new scenario');assert.equal(JSON.stringify(v32Import.migration.archivedCompletions['day-031'].catalogCandidatePhraseIds),JSON.stringify(nativeV32Plan.lessons[30].phraseIds));assert.equal(v32Import.completions['day-032'],undefined,'changed lesson completion is archived after import');assert.equal(JSON.stringify(v32Import.migration.archivedCompletions['day-032'].catalogCandidatePhraseIds),JSON.stringify(nativeV32Plan.lessons[31].phraseIds));assert.ok([...nativeV32Plan.lessons[30].phraseIds,...nativeV32Plan.lessons[31].phraseIds].every(id=>v32Import.introducedPhraseIds.includes(id)),'V3.2 archives preserve phrase-level introduction evidence');assert.equal(v32Import.activeSession.learnIndex,2);assert.equal(JSON.stringify(v32Import.activeSession.phraseIds),JSON.stringify(nativeV32Plan.lessons[31].phraseIds),'V3.2 active phrase IDs remain resumable');assert.equal(JSON.stringify(v32Import.activeSession.reviewPhraseIds),JSON.stringify(nativeV32Plan.lessons[30].phraseIds));assert.equal(JSON.stringify(v32Import.activityDates),JSON.stringify(['2026-11-09','2026-11-10','2026-11-11']));assert.equal(v32Import.track,'workplace');
const unknownImport=boot();unknownImport.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify({app:'TomEng',schemaVersion:4,contentVersion:'native-v3-unknown',data:{schemaVersion:4,contentVersion:'native-v3-unknown',saved:['p151'],learned:[],reviews:{},completions:{}}})}]}});assert.equal(JSON.stringify(unknownImport.app.getState().saved),JSON.stringify([]),'unknown content versions are rejected without remapping');assert.equal([...unknownImport.storage.keys()].filter(k=>k.startsWith('tomeng_before_import_')).length,0);
const mismatchImport=boot();mismatchImport.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify({app:'TomEng',schemaVersion:5,contentVersion:'native-v3.2',data:{...v32Data,schemaVersion:4,contentVersion:'native-v3.1'}})}]}});assert.equal(JSON.stringify(mismatchImport.app.getState().saved),JSON.stringify([]),'conflicting envelope and payload versions are rejected without mutation');assert.equal([...mismatchImport.storage.keys()].filter(k=>k.startsWith('tomeng_before_import_')).length,0);
const noBackupImport=boot({},'2026-11-11',{failBackupWrite:true});noBackupImport.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify({app:'TomEng',schemaVersion:5,contentVersion:'native-v3.2',data:v32Data})}]}});assert.equal(JSON.stringify(noBackupImport.app.getState().saved),JSON.stringify([]),'import stops when the before-import backup cannot be written');assert.equal([...noBackupImport.storage.keys()].filter(k=>k.startsWith('tomeng_before_import_')).length,0);
const dailyLesson=fresh.meta.lessons[0],dailySession={lessonId:dailyLesson.id,phraseIds:[...dailyLesson.phraseIds],reviewPhraseIds:[],phase:'learn',reviewLessonId:null,reviewIndex:0,reviewDone:[],learnIndex:0,learnedViewed:[],recallIndex:0,recallRevealed:false,recallDone:[],revealed:false};const dailySeed={[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',saved:[],learned:[],completions:{},reviews:{},sessions:[],activeSession:dailySession})};const failedDaily=boot(dailySeed,'2026-11-11',{failWrites:true});const dailyPersistedBefore=failedDaily.storage.get(key);failedDaily.click({page:'learn'});failedDaily.click({action:'reveal'});failedDaily.click({mark:'ready',id:dailyLesson.phraseIds[0]});assert.equal(failedDaily.app.getPersistenceState(),'unsaved','daily learning shows unsaved state after quota failure');assert.equal(failedDaily.app.getState().activeSession.learnIndex,1,'daily learning remains recoverable in memory');assert.equal(failedDaily.storage.get(key),dailyPersistedBefore,'failed daily write does not claim progress was persisted');assert.match(failedDaily.html(),/Tiến độ chưa lưu trên thiết bị/,'persistent warning is shown after save failure');assert.equal(failedDaily.triggerBeforeUnload().prevented,true,'leaving the page prompts while progress is unsaved');failedDaily.click({action:'export-pending'});assert.equal(JSON.parse(failedDaily.downloaded()).data.activeSession.learnIndex,1,'backup export contains unsaved daily progress');failedDaily.restoreStorage();failedDaily.click({action:'retry-save'});assert.equal(failedDaily.app.getPersistenceState(),'saved','retry clears the unsaved state after storage recovers');assert.equal(JSON.parse(failedDaily.storage.get(key)).activeSession.learnIndex,1,'retry persists the pending daily progress');assert.doesNotMatch(failedDaily.html(),/Tiến độ chưa lưu trên thiết bị/);
const silentDaily=boot(dailySeed,'2026-11-11',{dropWrites:true});const silentBefore=silentDaily.storage.get(key);silentDaily.click({page:'learn'});silentDaily.click({action:'reveal'});assert.equal(silentDaily.app.getPersistenceState(),'unsaved','readback mismatch is treated as a write failure');assert.equal(silentDaily.storage.get(key),silentBefore,'silent storage write failure leaves last saved lesson intact');assert.match(silentDaily.html(),/Tiến độ chưa lưu trên thiết bị/);
const finalSession={...dailySession,phase:'quick',learnedViewed:[...dailyLesson.phraseIds],learnIndex:5,recallIndex:4,recallRevealed:true,recallDone:dailyLesson.phraseIds.slice(0,4)};const failedCompletion=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',saved:[],learned:[],completions:{},reviews:{},sessions:[],activeSession:finalSession})},'2026-11-11',{failWrites:true});failedCompletion.click({page:'learn'});failedCompletion.click({newRating:'good',id:dailyLesson.phraseIds[4]});assert.equal(failedCompletion.app.getPersistenceState(),'unsaved','completion remains explicitly unsaved if its write fails');assert.equal(failedCompletion.app.getState().activeSession.phase,'apply','fifth recall persists the next application phase in memory');assert.match(failedCompletion.toast(),/chưa lưu trên thiết bị/i,'completion does not announce successful persistence');assert.match(failedCompletion.html(),/Tiến độ chưa lưu trên thiết bị/);
const importDestinationSeed={[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:['p001'],learned:['p002'],completions:{},reviews:{}})};const failedDestinationImport=boot(importDestinationSeed,'2026-11-11',{failImportDestination:true});const importDestinationBefore=failedDestinationImport.storage.get(key);failedDestinationImport.document.onchange({target:{id:'import-file',files:[{text:JSON.stringify({app:'TomEng',schemaVersion:5,contentVersion:'native-v3.2',data:v32Data})}]}});assert.equal(JSON.stringify(failedDestinationImport.app.getState().saved),JSON.stringify(['p001']),'failed destination write leaves live in-memory store untouched');assert.equal(failedDestinationImport.storage.get(key),importDestinationBefore,'failed destination write restores or retains prior persisted value');assert.match(failedDestinationImport.toast(),/quota|không/i,'failed import reports failure without success state');assert.ok([...failedDestinationImport.storage.keys()].some(k=>k.startsWith('tomeng_before_import_')),'transaction still retains before-import snapshot');



const oldCompletions={'day-001':{lessonId:'day-001',day:1,date:'2026-01-01'},'day-031':{lessonId:'day-031',day:31,date:'2026-02-01'},'day-240':{lessonId:'day-240',day:240,date:'2026-09-01'}};
const completionMigration=boot({'tomeng_reflex_v3':JSON.stringify({schemaVersion:3,saved:[],learned:['p151'],completions:oldCompletions})});
assert.ok(completionMigration.app.getState().completions['day-001'],'early lesson history is preserved in place');
assert.equal(completionMigration.app.getState().completions['day-031'],undefined,'reshuffled lesson progress is not falsely applied to different phrases');
assert.equal(Object.keys(completionMigration.app.getState().migration.archivedCompletions).length,2,'later lesson history remains in the migration archive');

const queueReviews={};for(let i=1;i<=20;i++)queueReviews['p'+String(i).padStart(3,'0')]={dueDate:'2000-01-01',repetitions:1,interval:1};
const queue=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],completions:{},reviews:queueReviews})});
queue.click({page:'due'});
assert.equal((queue.html().match(/class="due-card"/g)||[]).length,7,'optional SRS queue is capped so review debt cannot become overwhelming');
const missed=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],streak:9,completions:{'day-001':{day:1,lessonId:'day-001',phraseIds:fresh.meta.lessons[0].phraseIds,date:'2026-11-01'}},reviews:{}})});
assert.equal(missed.app.getState().streak,0,'missed calendar days reset streak');
assert.equal(missed.app.getState().activeSession.reviewLessonId,'day-001');
assert.equal(missed.app.getState().activeSession.reviewSnapshotSource,'legacy-completion-fallback','legacy users without session logs keep a clearly marked completion fallback');
assert.equal(JSON.stringify(missed.app.getState().activeSession.reviewPhraseIds),JSON.stringify(fresh.meta.lessons[0].phraseIds.filter(id=>!missed.app.getState().activeSession.phraseIds.includes(id)).slice(0,5)),'legacy completion fallback is used only when no actual session snapshot exists');

const completions={};for(let day=1;day<=30;day++)completions['day-'+String(day).padStart(3,'0')]={day,lessonId:'day-'+String(day).padStart(3,'0'),date:'2026-10-'+String(day).padStart(2,'0')};
const day31=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:[],learned:[],completions,lastCompletedLessonId:'day-030'})});
assert.equal(day31.app.getState().activeSession.lessonId,'day-031');
assert.equal(day31.app.getState().introducedPhraseIds.length,150,'30 completed V3.2 lessons restore 150 phrase introductions from snapshots');
const migrationSamples={};for(const count of [31,100]){const done={};for(let day=1;day<=count;day++){const old=nativeV32Plan.lessons[day-1];done[old.id]={day,lessonId:old.id,phraseIds:[...old.phraseIds],planVersion:'native-v3.2',date:'2026-10-01'};}const migrated=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',saved:['p151'],learned:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:7,repetitions:3}},completions:done,lastCompletedLessonId:`day-${String(count).padStart(3,'0')}`})});migrationSamples[count]=migrated;const state=migrated.app.getState();assert.equal(state.introducedPhraseIds.length,count*5,`V3.2 ${count}-lesson migration counts snapshot IDs exactly once`);assert.equal(new Set(state.introducedPhraseIds).size,count*5);assert.equal(state.learned.includes('p151'),true,'old learned/mastered state stays separate from introduced IDs');assert.equal(state.reviews.p151.interval,7,'SRS interval survives plan migration');assert.ok(state.activeSession.newPhraseIds.length>=1&&state.activeSession.newPhraseIds.length<=5,'remaining session flexibly allocates new phrases after migration');assert.equal(state.activeSession.phraseIds.length,5,'migration resumes a complete five-phrase scenario');assert.equal(state.activeSession.newPhraseIds.some((id)=>state.introducedPhraseIds.includes(id)),false,'the next Learn session never reissues an introduced phrase after migration');}
function migrationSessionSnapshot(version,schemaVersion,actualIds){
  const sourcePlan=fresh.legacyPlans.find(plan=>plan.version===version),priorLesson=sourcePlan.lessons.find(lesson=>lesson.id==='day-030'),completionAt='2026-11-10T12:00:00.000Z';
  const snapshot={lessonId:'day-030',date:'2026-11-10',completedAt:completionAt,sessionSequence:12,phraseIds:[...actualIds],practicedPhraseIds:[...actualIds],newPhraseIds:actualIds.slice(0,3),reusePhraseIds:actualIds.slice(3),introducedCount:3,applicationPracticed:true,planVersion:version};
  const state=boot({[key]:JSON.stringify({schemaVersion,contentVersion:version,track:'mixed',saved:['p151'],learned:['p152'],introducedPhraseIds:actualIds,completions:{'day-030':{lessonId:'day-030',day:30,phraseIds:[...priorLesson.phraseIds],date:'2026-11-10',completedAt:completionAt}},sessions:[snapshot],reviews:{p151:{dueDate:'2026-11-13',interval:3,repetitions:2}},activeSession:null})},'2026-11-12');
  const active=state.app.getState().activeSession,expected=actualIds.filter(id=>!active.phraseIds.includes(id)).slice(0,5);
  assert.equal(active.reviewSnapshotSource,'session',`${version} migration trusts the genuine session snapshot over the static completion`);
  assert.equal(JSON.stringify(active.reviewPhraseIds),JSON.stringify(expected),`${version} migration preserves actual practice IDs and excludes only today's overlap`);
  assert.equal(JSON.stringify(JSON.parse(state.storage.get(key)).sessions[0].practicedPhraseIds),JSON.stringify(actualIds),`${version} migration retains the session snapshot without substituting catalog IDs`);
  assert.ok(state.app.getState().saved.includes('p151'));assert.ok(state.app.getState().learned.includes('p152'));assert.equal(state.app.getState().reviews.p151.interval,3);
  assert.ok([...state.storage.keys()].some(name=>name.startsWith('tomeng_plan_migration_backup_')),`${version} migration keeps a verified pre-update backup`);
}
migrationSessionSnapshot('native-v3.2',5,['p151','p159','p168','p001','p002']);
migrationSessionSnapshot('native-v3.3',6,['p170','p175','p180','p003','p004']);
const strandedId=fresh.phrases.at(-1).id,allPhraseSet=fresh.phrases.map(phrase=>phrase.id),oneLeft=[key,JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',track:'mixed',introducedPhraseIds:allPhraseSet.filter(id=>id!==strandedId),saved:['p151'],learned:['p152'],reviews:{p151:{dueDate:'2000-01-01',lastRating:'again'}},completions:{},sessions:[],activeSession:null})],adversarialPartial=boot({[oneLeft[0]]:oneLeft[1]});
assert.equal(adversarialPartial.app.getState().introducedPhraseIds.length,1199,'adversarial partial state leaves exactly one unseen ID');
assert.equal(adversarialPartial.app.getState().activeSession.newPhraseIds.includes(strandedId),true,'a final unseen catalog ID is allocated instead of being stranded');
assert.equal(adversarialPartial.app.getState().activeSession.phraseIds.length,5,'anti-starvation fallback still builds a five-phrase session');
const v32CompletionLesson=nativeV32Plan.lessons[29],migratedOneLeft=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',track:'mixed',introducedPhraseIds:allPhraseSet.filter(id=>id!==strandedId),saved:['p151'],learned:['p152'],reviews:{p151:{interval:4,dueDate:'2026-11-15',repetitions:2}},completions:{[v32CompletionLesson.id]:{lessonId:v32CompletionLesson.id,day:30,phraseIds:[...v32CompletionLesson.phraseIds],planVersion:'native-v3.2',date:'2026-11-10'}},sessions:[],activeSession:null})},'2026-11-12');
assert.equal(migratedOneLeft.app.getState().activeSession.newPhraseIds.includes(strandedId),true,'V3.2 migration cannot strand the final unseen ID');
assert.equal(migratedOneLeft.app.getState().introducedPhraseIds.length,1199,'migration preserves the unique-introduced count');
assert.ok(migratedOneLeft.app.getState().saved.includes('p151'));assert.ok(migratedOneLeft.app.getState().learned.includes('p152'));assert.equal(migratedOneLeft.app.getState().reviews.p151.interval,4,'SRS schedule survives anti-starvation migration');

// A V3.1 plan update must archive incompatible lesson completion and preserve its phrase-level history.
const planMigrationSource=boot(),priorPlan=planForVersion('native-v3.1'),originalPlan=planForVersion('native-v3');
const completedBeforeUpdate={};for(let day=1;day<=30;day++){const l=fresh.meta.lessons[day-1];completedBeforeUpdate[l.id]={day,lessonId:l.id,phraseIds:l.phraseIds,date:'2026-10-01'};}
completedBeforeUpdate['day-031']={day:31,lessonId:'day-031',date:'2026-10-02'};completedBeforeUpdate['day-032']={day:32,lessonId:'day-032',date:'2026-10-03'};
const planMigrated=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:['p001'],learned:['p151'],speakingPracticed:['p151'],reviews:{p151:{dueDate:'2026-11-12',interval:1,repetitions:1}},completions:completedBeforeUpdate,lastCompletedLessonId:'day-031'})});
assert.equal(planMigrated.app.getState().completions['day-031'],undefined,'changed V3.1 membership is archived before the new scenario plan is used');assert.ok(planMigrated.app.getState().migration.archivedCompletions['day-031']);
assert.equal(planMigrated.app.getState().completions['day-032'],undefined,'changed lesson membership is not applied to a different five-phrase lesson');
assert.ok(planMigrated.app.getState().migration.archivedCompletions['day-032'].possiblePhraseIdsByPlan['native-v3'].length===5,'ambiguous old plan candidates are preserved in migration archive');
assert.ok(planMigrated.app.getState().saved.includes('p001'));
assert.ok(planMigrated.app.getState().learned.includes('p151'));
assert.equal(planMigrated.app.getState().reviews.p151.interval,1);
assert.ok(planMigrated.app.getState().selfReportedPractice.includes('p151'),'legacy practice marks are retained transparently');
assert.ok([...planMigrated.storage.keys()].some(k=>k.startsWith('tomeng_plan_migration_backup_')));
const legacyMigrationRaw=JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:['p001'],learned:['p151'],completions:completedBeforeUpdate,lastCompletedLessonId:'day-031'});const blockedPlanMigration=boot({[key]:legacyMigrationRaw},'2026-11-11',{failPlanBackup:true});assert.equal(blockedPlanMigration.storage.get(key),legacyMigrationRaw,'plan migration is not persisted if its backup cannot be created');assert.equal([...blockedPlanMigration.storage.keys()].filter(k=>k.startsWith('tomeng_plan_migration_backup_')).length,0);assert.match(blockedPlanMigration.html(),/Chưa thể cập nhật sổ tay/,'unsafe old lesson plan is not exposed as an active app');
const blockedPlanWrite=boot({[key]:legacyMigrationRaw},'2026-11-11',{failMigrationDestination:true});assert.equal(blockedPlanWrite.storage.get(key),legacyMigrationRaw,'failed destination write rolls back to the original V3.1 data');assert.ok([...blockedPlanWrite.storage.keys()].some(k=>k.startsWith('tomeng_plan_migration_backup_')),'migration snapshot exists before attempting destination write');assert.match(blockedPlanWrite.html(),/Chưa thể cập nhật sổ tay/);
const oldEngineRaw=JSON.stringify({schemaVersion:3,saved:['p151'],learned:[],completions:{},reviews:{}});const blockedLegacyMigration=boot({'tomeng_reflex_v3':oldEngineRaw},'2026-11-11',{failLegacyBackup:true});assert.equal(blockedLegacyMigration.storage.has(key),false,'legacy migration does not create V3 store when backup fails');assert.equal(blockedLegacyMigration.storage.get('tomeng_reflex_v3'),oldEngineRaw);assert.match(blockedLegacyMigration.html(),/Chưa thể cập nhật sổ tay/);
const preMigration=JSON.parse(planMigrated.storage.get('tomeng_native_v3'));planMigrated.click({page:'progress'});planMigrated.click({action:'rollback-migration'});assert.equal(JSON.parse(planMigrated.storage.get(key)).contentVersion,'native-v3.1','rollback restores the exact store captured before the plan migration');assert.ok([...planMigrated.storage.keys()].some(k=>k.startsWith('tomeng_before_rollback_')));
const oldActive={lessonId:'day-032',phase:'quick',learnIndex:5,learnedViewed:[...originalPlan.lessons[31].phraseIds],reviewLessonId:'day-031',reviewIndex:5,reviewDone:[...originalPlan.lessons[30].phraseIds],recallIndex:0,recallDone:[]};const activeCompletions={...completedBeforeUpdate};delete activeCompletions['day-032'];
const activeMigration=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions:activeCompletions,lastCompletedLessonId:'day-031',activeSession:oldActive})});
const legacySequence=activeMigration.legacyPlans.find(plan=>plan.version==='native-v3.1');
assert.deepEqual(activeMigration.app.getState().activeSession.phraseIds,legacySequence.lessons[31].phraseIds,'unfinished lesson resumes with its legacy phrase order');
assert.deepEqual(activeMigration.app.getState().activeSession.reviewPhraseIds,legacySequence.lessons[30].phraseIds,'unfinished review resumes with its legacy review snapshot');
assert.equal(activeMigration.app.getState().activeSession.learnedViewed[0],originalPlan.lessons[31].phraseIds[0]);
activeMigration.click({action:'continue'});for(const id of legacySequence.lessons[31].phraseIds){activeMigration.click({action:'quick-reveal'});activeMigration.click({newRating:'good',id});}assert.equal(activeMigration.app.getState().activeSession.phase,'apply');activeMigration.click({action:'scenario-complete'});assert.equal(activeMigration.app.getState().completions['day-032'],undefined,'finishing a preserved legacy session does not complete the reshuffled lesson');assert.equal(activeMigration.app.getState().migration.archivedCompletions['day-032'].archivedReason,'completed-preserved-legacy-session');assert.equal(activeMigration.app.getState().activeSession,null,'legacy session can finish and keeps the one-lesson-per-day cap');
const reviewPhaseSession={lessonId:'day-032',phase:'review',reviewLessonId:'day-031',reviewIndex:2,reviewDone:nativeV31Plan.lessons[30].phraseIds.slice(0,2),learnIndex:0,learnedViewed:[],recallIndex:0,recallDone:[]};
const reviewResume=boot({[key]:JSON.stringify({schemaVersion:4,contentVersion:'native-v3.1',saved:[],learned:[],completions:completedBeforeUpdate,lastCompletedLessonId:'day-031',activeSession:reviewPhaseSession})});
assert.equal(JSON.stringify(reviewResume.app.getState().activeSession.phraseIds),JSON.stringify(nativeV31Plan.lessons[31].phraseIds),'V3.1 review-stage migration uses the source version, not tie-break scoring');assert.equal(JSON.stringify(reviewResume.app.getState().activeSession.reviewPhraseIds),JSON.stringify(nativeV31Plan.lessons[30].phraseIds));assert.equal(reviewResume.app.getState().activeSession.reviewIndex,2);assert.equal(reviewResume.app.getState().activeSession.reviewDone.length,2);

const firstWorkLesson=fresh.meta.lessons.find(l=>l.primaryCategoryId!=='everyday'&&l.primaryCategoryId!=='reflex');
const everydayToWork=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',track:'workplace',saved:[],learned:[],completions:{'day-001':{day:1,lessonId:'day-001',phraseIds:fresh.meta.lessons[0].phraseIds,date:'2026-11-10'}},lastCompletedLessonId:'day-001'})});
assert.equal(everydayToWork.app.getState().activeSession.lessonId,firstWorkLesson.id);assert.equal(everydayToWork.app.getState().activeSession.reviewLessonId,'day-001','track change still reviews the last completed Everyday session');assert.equal(JSON.stringify(everydayToWork.app.getState().activeSession.reviewPhraseIds),JSON.stringify(fresh.meta.lessons[0].phraseIds));
const firstEverydayLesson=fresh.meta.lessons.find(l=>l.primaryCategoryId==='everyday'||l.primaryCategoryId==='reflex');
const workplaceToEveryday=boot({[key]:JSON.stringify({schemaVersion:5,contentVersion:'native-v3.2',track:'everyday',saved:[],learned:[],completions:{[firstWorkLesson.id]:{day:firstWorkLesson.day,lessonId:firstWorkLesson.id,phraseIds:firstWorkLesson.phraseIds,date:'2026-11-10'}},lastCompletedLessonId:firstWorkLesson.id})});
assert.equal(workplaceToEveryday.app.getState().activeSession.lessonId,firstEverydayLesson.id);assert.equal(workplaceToEveryday.app.getState().activeSession.reviewLessonId,firstWorkLesson.id,'track change still reviews the last completed Workplace session');assert.equal(JSON.stringify(workplaceToEveryday.app.getState().activeSession.reviewPhraseIds),JSON.stringify(firstWorkLesson.phraseIds));


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
const finishedPlanCompletions={};for(const lesson of fresh.meta.lessons)finishedPlanCompletions[lesson.id]={day:lesson.day,lessonId:lesson.id,phraseIds:[...lesson.phraseIds],planVersion:'native-v3.3',date:'2026-11-10'};
const done=boot({[key]:JSON.stringify({schemaVersion:6,contentVersion:'native-v3.3',saved:[],learned:[],completions:finishedPlanCompletions,lastCompletedLessonId:'day-240'})});
assert.equal(done.app.getState().activeSession.mode,'mastery','all introduced IDs enter Mastery Mode without resetting completions');
assert.match(done.html(),/Mastery Mode/);
const track=boot();track.click({track:'workplace'});assert.equal(track.app.getState().track,'workplace','track selector is wired and persisted');const workplaceLesson=track.meta.lessons.find(l=>l.primaryCategoryId!=='everyday'&&l.primaryCategoryId!=='reflex');assert.equal(track.app.getState().activeSession.lessonId,workplaceLesson.id,'untouched session follows the selected track');assert.equal(boot(Object.fromEntries(track.storage)).app.getState().track,'workplace','track choice persists across reload');
track.click({page:'more'});assert.match(track.html(),/data-page="grammar"/);assert.match(track.html(),/data-page="saved"/);assert.match(track.html(),/data-page="progress"/);
const library=boot();library.click({page:'library'});assert.equal((library.html().match(/class="phrase-card"/g)||[]).length,60,'library renders a bounded first page');library.click({action:'library-more'});assert.equal((library.html().match(/class="phrase-card"/g)||[]).length,120,'library load-more appends a bounded page');
const editedPhrase={en:'A distinct edited sample.',vi:'Một câu mẫu đã sửa riêng.',context:'In this edited scenario.',follow:'This is the edited next line.'};
const editedPhraseId=fresh.meta.lessons[30].phraseIds[0],editStore={schemaVersion:5,contentVersion:'native-v3.2',saved:['p151'],learned:[],reviews:{p151:{dueDate:'2000-01-01',interval:1,repetitions:1}},contentEdits:{p151:editedPhrase,[editedPhraseId]:editedPhrase},completions:{},track:'mixed'};
const editViews=boot({[key]:JSON.stringify(editStore)});editViews.click({page:'saved'});assert.match(editViews.html(),/A distinct edited sample/);editViews.click({open:'p151'});assert.match(editViews.modalHtml(),/This is the edited next line/);editViews.click({page:'due'});assert.match(editViews.html(),/Một câu mẫu đã sửa riêng/);editViews.click({page:'rescue'});editViews.document.oninput({target:{id:'rescue-search',value:'edited scenario'}});assert.match(editViews.html(),/A distinct edited sample/);
const editLearning=boot({[key]:JSON.stringify({...editStore,activeSession:{lessonId:'day-031',phase:'learn',phraseIds:fresh.meta.lessons[30].phraseIds,reviewPhraseIds:[],learnIndex:0,learnedViewed:[],reviewDone:[],reviewIndex:0,recallIndex:0,recallDone:[]}})});editLearning.click({action:'continue'});editLearning.click({action:'reveal'});assert.match(editLearning.html(),/A distinct edited sample/,'content edits reach Learn view');

track.click({page:'rescue'});track.document.oninput({target:{id:'rescue-search',value:'airport'}});assert.match(track.html(),/airport/i,'Rescue Mode searches arbitrary situations across the library');
track.click({page:'listening'});assert.match(track.html(),/disabled/);track.click({action:'listening-play'});assert.match(track.html(),/disabled/,'unsupported TTS does not unlock transcript');
const listener=boot({},'2026-11-11',{speech:true});listener.click({page:'listening'});assert.doesNotMatch(listener.html(),/class="answer-box"/);listener.click({action:'listening-play'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'listening does not reveal the answer');listener.click({action:'listening-reveal'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'transcript stays locked while audio is playing');listener.finishSpeech();listener.click({action:'listening-reveal'});assert.match(listener.html(),/class="answer-box"/,'transcript appears only after audio and self-check');listener.click({action:'listening-next'});assert.doesNotMatch(listener.html(),/class="answer-box"/,'next item clears revealed transcript');
const noMic=boot();noMic.click({action:'mic',id:'p001'});assert.equal(noMic.app.getState().speakingPracticed.length,0,'unsupported microphone does not count as speaking practice');
const failedMic=boot({},'2026-11-11',{recognition:'throw'});failedMic.click({action:'mic',id:'p001'});assert.equal(failedMic.app.getState().speakingPracticed.length,0,'microphone start failure does not count as speaking practice');
const mic=boot({},'2026-11-11',{recognition:true});mic.click({action:'mic',id:'p001'});mic.recognitionError('not-allowed');assert.equal(mic.app.getState().speakingPracticed.length,0,'permission failure does not count as speaking practice');mic.click({action:'mic',id:'p001'});mic.recognitionResult('I am concerned about it');assert.equal(mic.app.getState().speakingPracticed.join(','),'p001','nonempty recognition result is recorded as a practice attempt, not a pronunciation score');
track.click({page:'conversation'});assert.match(track.html(),/Hội thoại mẫu 2 lượt/);track.click({action:'reveal'});assert.match(track.html(),/Người đối diện/);track.click({action:'conversation-next'});assert.match(track.html(),/Hội thoại mẫu 2 lượt/);
function completeNewSession(state){state.click({action:'continue'});let session=state.app.getState().activeSession;assert.ok(session,'a current learning session is resumable');if(session.phase==='review'){for(const id of session.reviewPhraseIds){state.click({action:'reveal'});state.click({rating:'good',id});}session=state.app.getState().activeSession;}assert.equal(session.phase,'learn');assert.equal(session.phraseIds.length,5,'every learning session presents exactly five total phrase IDs');for(const id of session.phraseIds){state.click({action:'reveal'});state.click({mark:'ready',id});}assert.equal(state.app.getState().activeSession.phase,'quick');for(const id of session.phraseIds){state.click({action:'quick-reveal'});state.click({newRating:['again','hard','good'][id.charCodeAt(2)%3],id});}assert.equal(state.app.getState().activeSession.phase,'apply');state.click({action:'scenario-complete'});assert.equal(state.app.getState().activeSession,null,'completed application saves and clears the session');}
const allPhraseIds=new Set(fresh.meta.lessons.flatMap((lesson)=>lesson.candidatePhraseIds)),trackCycle=['everyday','workplace','mixed','everyday','workplace','mixed','everyday','mixed','workplace','mixed'];let trackSeed={};
for(let day=0;day<trackCycle.length;day++){const current=boot(trackSeed,fresh.app.shiftDate('2026-02-01',day));if(current.app.getState().track!==trackCycle[day])current.click({track:trackCycle[day]});const before=current.app.getState(),session=before.activeSession,newIds=[...session.newPhraseIds];assert.equal(session.phraseIds.length,5);assert.ok(newIds.length>=1&&newIds.length<=5,'each session introduces at least one but no more than five new phrases');assert.equal(new Set(session.phraseIds).size,5);assert.equal(session.newPhraseIds.some((id)=>before.introducedPhraseIds.includes(id)),false,'track changes never allocate an already introduced ID as new');assert.ok(session.reinforcementPhraseIds.every((id)=>before.introducedPhraseIds.includes(id)),'old support phrases always have prior introduction evidence');assert.equal(new Set([...session.newPhraseIds,...session.reinforcementPhraseIds]).size,5,'new and old roles partition the five phrase slots');completeNewSession(current);const after=current.app.getState();assert.equal(after.introducedPhraseIds.length,before.introducedPhraseIds.length+newIds.length,'progress advances only by the distinct new IDs');trackSeed=Object.fromEntries(current.storage);}
assert.equal(new Set(boot(trackSeed).app.getState().introducedPhraseIds).size,boot(trackSeed).app.getState().introducedPhraseIds.length,'Everyday → Workplace → Mixed switching preserves unique phrase coverage');
function simulateCurriculum(initialSeed,initialDay,maxSessions=800,track='mixed'){
  let seed=initialSeed,day=initialDay,state=boot(seed,day),expected=state.app.getState().introducedPhraseIds.length,sessionCount=0,mixedCount=0;
  const ratioCounts={};
  if(state.app.getState().track!==track)state.click({track});
  for(let index=0;index<maxSessions&&expected<1200;index++){
    if(index>0){
      day=fresh.app.shiftDate(day,1);
      state.setDate(day);
      if(!state.app.getState().activeSession)state.click({action:'continue'});
    }
    let before=state.app.getState(),session=before.activeSession;
    assert.ok(session,`session ${index+1} exists until every selected-track phrase is introduced`);
    if(index>0&&index%40===0){
      const reserved={phraseIds:[...session.phraseIds],candidatePhraseIds:[...session.candidatePhraseIds],newPhraseIds:[...session.newPhraseIds],reusePhraseIds:[...session.reusePhraseIds],scenarioSnapshot:JSON.parse(JSON.stringify(session.scenarioSnapshot))};
      seed=Object.fromEntries(state.storage);
      state=boot(seed,day);
      session=state.app.getState().activeSession;
      assert.equal(JSON.stringify(session.phraseIds),JSON.stringify(reserved.phraseIds),`refresh ${index} preserves the reserved five IDs`);
      assert.equal(JSON.stringify(session.candidatePhraseIds),JSON.stringify(reserved.candidatePhraseIds),`refresh ${index} preserves candidate roles`);
      assert.equal(JSON.stringify(session.newPhraseIds),JSON.stringify(reserved.newPhraseIds),`refresh ${index} preserves NEW roles`);
      assert.equal(JSON.stringify(session.reusePhraseIds),JSON.stringify(reserved.reusePhraseIds),`refresh ${index} preserves REUSE roles`);
      assert.equal(JSON.stringify(session.scenarioSnapshot),JSON.stringify(reserved.scenarioSnapshot),`refresh ${index} preserves scenario copy and steps`);
      before=state.app.getState();
    }
    assert.equal(session.phraseIds.length,5,`session ${index+1} has five total phrase slots`);
    assert.ok(session.newPhraseIds.length>=1&&session.newPhraseIds.length<=5,`session ${index+1} introduces between one and five new IDs`);
    assert.equal(new Set(session.phraseIds).size,5);
    assert.equal(new Set(session.newPhraseIds).size,session.newPhraseIds.length);
    assert.equal(session.newPhraseIds.some((id)=>before.introducedPhraseIds.includes(id)),false,`session ${index+1} never repeats an introduced phrase as new`);
    assert.ok(session.reusePhraseIds.every((id)=>before.introducedPhraseIds.includes(id)),`session ${index+1} only reuses previously introduced IDs`);
    assert.equal(JSON.stringify(session.reusePhraseIds),JSON.stringify(session.reinforcementPhraseIds),'compatibility alias matches explicit reusePhraseIds');
    assert.equal(new Set([...session.newPhraseIds,...session.reusePhraseIds]).size,5,`session ${index+1} separates the five new/old phrase roles`);
    assert.ok(session.scenarioSnapshot.steps.every((step)=>step.kind==='new'&&session.newPhraseIds.includes(step.phraseId)||step.kind==='reuse'&&session.reusePhraseIds.includes(step.phraseId)),'scenario snapshot labels every phrase as NEW or REUSE');
    assert.ok(session.reusePhraseIds.every((id)=>before.introducedPhraseIds.includes(id)&&allPhraseIds.has(id)),'reuse IDs stay inside the catalog and have introduction evidence');
    if(session.newPhraseIds.length<5)mixedCount++;
    ratioCounts[session.newPhraseIds.length]=(ratioCounts[session.newPhraseIds.length]||0)+1;
    const newlyIntroduced=[...session.newPhraseIds];
    completeNewSession(state);
    const after=state.app.getState();expected+=newlyIntroduced.length;
    assert.equal(after.introducedPhraseIds.length,expected,`session ${index+1} advances by its actual new-ID count`);
    assert.equal(after.introducedPhraseIds.some((id)=>!allPhraseIds.has(id)),false,'introduced IDs stay inside the catalog');
    assert.equal(new Set(after.introducedPhraseIds).size,expected,'the introduced set has no duplicates');
    const remainder=[...allPhraseIds].filter((id)=>!after.introducedPhraseIds.includes(id));
    assert.equal(after.introducedPhraseIds.length+remainder.length,1200,'introduced ∪ remaining always equals the full catalog');
    assert.equal(remainder.some((id)=>after.introducedPhraseIds.includes(id)),false,'introduced ∩ remaining is empty');
    seed=Object.fromEntries(state.storage);sessionCount++;
  }
  assert.equal(expected,1200,`selected ${track} curriculum eventually introduces the full catalog`);
  return {seed,day:fresh.app.shiftDate(day,1),sessionCount,mixedCount,ratioCounts};
}
const fullMixed=simulateCurriculum({},'2026-01-01',800);assert.ok(fullMixed.sessionCount>240,'the five-phrase sessions can introduce fewer than five new phrases and continue past the 240 base units');assert.ok(fullMixed.mixedCount>0,'completed sessions actually combine new phrases with old scenario-family reuse');assert.ok(Object.keys(fullMixed.ratioCounts).length>1,'adaptive schedule changes the new-to-reuse ratio as prior learning and SRS pressure change');const fullState=boot(fullMixed.seed,fullMixed.day);assert.equal(fullState.app.getState().introducedPhraseIds.length,1200,'the full Mixed route introduces every catalog ID');assert.equal(Object.values(fullState.app.getState().completions).filter((item)=>item.planVersion==='native-v3.4').length,fresh.meta.lessons.length,'full clean coverage records each scenario candidate unit only after all its new IDs are introduced');fullState.click({action:'continue'});assert.equal(fullState.app.getState().activeSession.mode,'mastery','the next day transitions to Mastery Mode, not lesson one');const masterSession=fullState.app.getState().activeSession,completionCount=Object.keys(fullState.app.getState().completions).length;assert.ok(masterSession.phraseIds.length>=5&&masterSession.phraseIds.length<=7);assert.ok(masterSession.phraseIds.every((id)=>fullState.app.getState().introducedPhraseIds.includes(id)));for(const id of masterSession.phraseIds){fullState.click({action:'mastery-reveal'});fullState.click({masteryRating:'again',id});}assert.equal(fullState.app.getState().activeSession.phase,'mastery-apply');fullState.click({action:'scenario-complete'});assert.equal(fullState.app.getState().introducedPhraseIds.length,1200,'Mastery does not reintroduce phrase IDs');assert.equal(Object.keys(fullState.app.getState().completions).length,completionCount,'Mastery does not reset or inflate lesson completions');assert.equal(fullState.app.getState().sessions.at(-1).introducedCount,0,'Mastery records no new IDs');assert.equal(fullState.app.getState().sessions.at(-1).mastery,true,'Mastery application is recorded separately from new curriculum lessons');
const everydayRoute=fresh.meta.lessons.filter((lesson)=>['everyday','reflex'].includes(lesson.primaryCategoryId)),everydayIds=[...new Set(everydayRoute.flatMap((lesson)=>lesson.candidatePhraseIds))],everydayCompleted=Object.fromEntries(everydayRoute.map((lesson)=>[lesson.id,{lessonId:lesson.id,day:lesson.day,phraseIds:[...lesson.phraseIds],newPhraseIds:[...lesson.candidatePhraseIds],planVersion:'native-v3.4',date:'2026-11-10'}]));const everydayOnly=boot({[key]:JSON.stringify({schemaVersion:7,contentVersion:'native-v3.4',track:'everyday',introducedPhraseIds:everydayIds,completions:everydayCompleted,reviews:{},sessions:[]})});assert.equal(everydayOnly.app.getState().introducedPhraseIds.length,625);assert.equal(everydayOnly.app.getState().activeSession,null,'an exhausted Everyday track does not falsely start a duplicate lesson');assert.match(everydayOnly.html(),/Đã học hết cụm mới trong Everyday/);assert.match(everydayOnly.html(),/Còn 575 cụm mới ở các track khác/);everydayOnly.click({track:'mixed'});assert.equal(everydayOnly.app.getState().track,'mixed');assert.ok(everydayOnly.app.getState().activeSession.newPhraseIds.every((id)=>!everydayIds.includes(id)),'Mixed resumes only with phrase IDs not introduced in Everyday');assert.match(everydayOnly.html(),/Đã học mới/);
const oldProgress=migrationSamples[100],oldSeed=Object.fromEntries(oldProgress.storage),oldDay='2026-11-11',resumed=simulateCurriculum(oldSeed,oldDay,800);assert.equal(boot(resumed.seed,resumed.day).app.getState().activeSession.mode,'mastery','V3.2 migration continuation reaches all 1,200 IDs before Mastery Mode');
console.log('PASS: actual five-phrase session review snapshots, identical-timestamp tie-breaks, 3+2 → 2+3 completion, V3.2/V3.3 snapshot migrations, legacy completion fallback, anti-starvation, full 1,200-ID coverage, track switching, Mastery, SRS and persistence regressions');
