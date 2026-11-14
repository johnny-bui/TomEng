(() => {
  'use strict';

  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  const timeOf = (value) => { const time = Date.parse(value || ''); return Number.isFinite(time) ? time : 0; };
  const keyOfSession = (item) => item?.id || [item?.date||'',item?.lessonId||'',item?.sessionSequence??'',item?.mode||'',item?.sessionType||'',(item?.phraseIds||[]).join(','),(item?.newPhraseIds||[]).join(',')].join('|');

  function preferMapItem(left, right, leftTime, rightTime, field) {
    if (!left) return right;
    if (!right) return left;
    const a=timeOf(left.syncModifiedAt||left.updatedAt||left.reviewedAt||left.completedAt||left.date||leftTime);
    const b=timeOf(right.syncModifiedAt||right.updatedAt||right.reviewedAt||right.completedAt||right.date||rightTime);
    if(a!==b)return a>b?left:right;
    if(field==='reviews'&&Number(left.interval||0)!==Number(right.interval||0))return Number(left.interval||0)>Number(right.interval||0)?left:right;
    return right;
  }

  function mergeMap(left={},right={},leftTime='',rightTime='',field='') {
    const out={};
    for(const key of new Set([...Object.keys(left||{}),...Object.keys(right||{})])){
      const localItem=left?.[key],remoteItem=right?.[key],winner=preferMapItem(localItem,remoteItem,leftTime,rightTime,field);
      if(field==='completions'&&localItem&&remoteItem){
        out[key]={...localItem,...remoteItem,...winner};
        for(const listField of ['catalogCandidatePhraseIds','practicedPhraseIds','newPhraseIds'])out[key][listField]=[...new Set([...(localItem[listField]||[]),...(remoteItem[listField]||[])])];
      }else out[key]=winner;
    }
    return out;
  }

  function mergeSetField(local,remote,field,syncMeta) {
    const localSet=new Set(Array.isArray(local?.[field])?local[field]:[]),remoteSet=new Set(Array.isArray(remote?.[field])?remote[field]:[]);
    const ids=new Set([...localSet,...remoteSet,...Object.keys(local?.syncMeta?.[field]||{}),...Object.keys(remote?.syncMeta?.[field]||{})]);
    const result=[],tombstones={};
    for(const id of ids){
      const localEntry=local?.syncMeta?.[field]?.[id]||(localSet.has(id)?{value:true,at:local?.cloudUpdatedAt||''}:null);
      const remoteEntry=remote?.syncMeta?.[field]?.[id]||(remoteSet.has(id)?{value:true,at:remote?.cloudUpdatedAt||''}:null);
      if(!localEntry&&!remoteEntry)continue;
      let winner;
      if(!localEntry)winner=remoteEntry;
      else if(!remoteEntry)winner=localEntry;
      else if(timeOf(localEntry.at)!==timeOf(remoteEntry.at))winner=timeOf(localEntry.at)>timeOf(remoteEntry.at)?localEntry:remoteEntry;
      else winner=(localEntry.value||remoteEntry.value)?(localEntry.value?localEntry:remoteEntry):localEntry;
      tombstones[id]={value:!!winner.value,at:winner.at||''};
      if(winner.value)result.push(id);
    }
    syncMeta[field]=tombstones;
    return result;
  }

  function mergeStores(local,remote) {
    if(!remote)return local;
    if(!local)return remote;
    const localTime=local.cloudUpdatedAt||'',remoteTime=remote.cloudUpdatedAt||'',newest=timeOf(localTime)>=timeOf(remoteTime)?local:remote;
    const syncMeta={...(local.syncMeta||{}),...(remote.syncMeta||{})},merged={...remote,...local,...newest};
    for(const field of ['saved','learned','speakingPracticed','selfReportedPractice'])merged[field]=mergeSetField(local,remote,field,syncMeta);
    for(const field of ['introducedPhraseIds','activityDates'])merged[field]=[...new Set([...(local[field]||[]),...(remote[field]||[])])];
    merged.syncMeta=syncMeta;
    merged.completions=mergeMap(local.completions,remote.completions,localTime,remoteTime,'completions');
    merged.reviews=mergeMap(local.reviews,remote.reviews,localTime,remoteTime,'reviews');
    merged.contentEdits=mergeMap(local.contentEdits,remote.contentEdits,localTime,remoteTime,'contentEdits');
    const sessions=new Map();
    for(const [collection,stamp] of [[remote.sessions||[],remoteTime],[local.sessions||[],localTime]])for(const item of collection){
      const key=keyOfSession(item);
      if(!(item?.id||item?.date||item?.lessonId))continue;
      sessions.set(key,preferMapItem(sessions.get(key),item,remoteTime,stamp,'sessions'));
    }
    merged.sessions=[...sessions.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.lessonId||'').localeCompare(String(b.lessonId||'')));
    merged.activeSession=newest.activeSession||null;
    const localMigration=local.migration||{},remoteMigration=remote.migration||{};
    if(localMigration||remoteMigration)merged.migration={...remoteMigration,...localMigration,...(timeOf(localTime)>=timeOf(remoteTime)?localMigration:remoteMigration),archivedCompletions:mergeMap(localMigration.archivedCompletions,remoteMigration.archivedCompletions,localTime,remoteTime,'completions'),unresolvedIds:[...new Set([...(localMigration.unresolvedIds||[]),...(remoteMigration.unresolvedIds||[])])]};
    merged.cloudUpdatedAt=new Date(Math.max(timeOf(localTime),timeOf(remoteTime))).toISOString();
    return merged;
  }

  const api={canonical,mergeStores};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(typeof window==='object')window.TOMENG_SYNC_MERGE=api;
})();
