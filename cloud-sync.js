(() => {
  'use strict';
  const config = window.TOMENG_SYNC_CONFIG || {};
  const api = window.TomEng;
  const state = {
    auth: null, session: null, user: null, loading: false, syncing: false, syncAgain: false,
    dirty: false, timer: null, message: '', messageType: 'info', pendingEmail: '', mode: 'sign-in',
    email: '', sdkReady: false, sdkError: '', lastSyncedAt: '', status: 'idle'
  };
  const dialog = document.createElement('dialog');
  dialog.className = 'sync-dialog';
  dialog.setAttribute('aria-labelledby', 'sync-dialog-title');
  (document.querySelector('#sync-root') || document.body).append(dialog);

  const safeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statusText = () => ({idle:'Chưa đăng nhập',loading:'Đang kết nối…',pending:'Có thay đổi chưa đồng bộ',syncing:'Đang đồng bộ…',synced:'Đã đồng bộ',offline:'Đang ngoại tuyến',error:'Chưa đồng bộ được'}[state.status] || 'Chưa đăng nhập');
  function updateTrigger() {
    document.querySelectorAll('[data-sync-action="open"]').forEach((button) => {
      button.dataset.syncStatus = state.status;
      button.setAttribute('aria-label', `Đồng bộ dữ liệu · ${statusText()}`);
      button.title = statusText();
    });
  }
  function showMessage(message, type='info') { state.message = message; state.messageType = type; renderDialog(); }
  function closeDialog() { if (dialog.open) dialog.close(); }

  function renderDialog() {
    const status = `<div class="sync-status-card" data-state="${safeText(state.status)}"><span class="sync-status-dot" aria-hidden="true"></span><div><b>${safeText(statusText())}</b><small>${state.lastSyncedAt ? `Lần gần nhất ${safeText(new Date(state.lastSyncedAt).toLocaleString('vi-VN'))}` : 'Tiến độ trên thiết bị luôn được giữ cục bộ.'}</small></div></div>`;
    let body = '';
    if (!config.enabled || !config.authUrl || !config.apiUrl) {
      body = '<p>Đồng bộ cloud chưa được cấu hình.</p>';
    } else if (state.sdkError) {
      body = `<p class="sync-error" role="alert">${safeText(state.sdkError)}</p><button class="sync-button" type="button" data-sync-action="retry-sdk">Thử kết nối lại</button>`;
    } else if (!state.sdkReady) {
      body = '<p>Đang tải dịch vụ đăng nhập…</p>';
    } else if (state.user) {
      body = `<div class="sync-user"><span class="sync-user-mark" aria-hidden="true">${safeText((state.user.email||'T').slice(0,1).toUpperCase())}</span><div><b>${safeText(state.user.name||'TomEng')}</b><small>${safeText(state.user.email||'')}</small></div></div><p class="sync-help">Bookmark, lịch ôn, phiên học, ghi chú biên tập và tuỳ chỉnh được gộp với dữ liệu trên thiết bị này.</p><button class="sync-button" type="button" data-sync-action="now" ${state.syncing?'disabled':''}>${state.syncing?'Đang đồng bộ…':'Đồng bộ ngay'}</button><button class="sync-secondary" type="button" data-sync-action="sign-out">Đăng xuất khỏi thiết bị này</button>`;
    } else if (state.pendingEmail) {
      body = `<p>Mã xác minh đã được gửi đến <b>${safeText(state.pendingEmail)}</b>. Nhập mã để xác minh tài khoản.</p><form data-sync-form="verify"><label>Mã xác minh<input name="otp" inputmode="numeric" autocomplete="one-time-code" minlength="4" maxlength="12" required></label><button class="sync-button" type="submit">Xác minh và bật đồng bộ</button><button class="sync-secondary" type="button" data-sync-action="back-to-auth">Quay lại</button></form>`;
    } else {
      body = `<form data-sync-form="auth"><label>Email<input name="email" type="email" autocomplete="email" value="${safeText(state.email)}" required></label><label>Mật khẩu<input name="password" type="password" autocomplete="${state.mode==='sign-up'?'new-password':'current-password'}" minlength="8" required></label><button class="sync-button" type="submit">${state.mode==='sign-up'?'Tạo tài khoản và gửi mã':'Đăng nhập và đồng bộ'}</button></form><button class="sync-secondary" type="button" data-sync-action="toggle-auth">${state.mode==='sign-up'?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Tạo tài khoản'}</button><p class="sync-help">Đăng nhập bằng Gmail cá nhân đã được cấp quyền. Mật khẩu được xử lý bởi Neon Auth; TomEng không lưu mật khẩu.</p>`;
    }
    const message = state.message ? `<p class="sync-message ${state.messageType==='error'?'sync-error':''}" role="status">${safeText(state.message)}</p>` : '';
    dialog.innerHTML = `<div class="sync-dialog-head"><div><span class="sync-eyebrow">TOMENG CLOUD</span><h2 id="sync-dialog-title">Tiến độ đi cùng anh.</h2></div><button class="sync-close" type="button" data-sync-action="close" aria-label="Đóng">×</button></div>${status}${message}<div class="sync-dialog-body">${body}</div><p class="sync-footer">Dữ liệu được gộp theo từng mục. TomEng giữ một bản sao cục bộ trên mỗi thiết bị.</p>`;
  }

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
    const a = timeOf(left.syncModifiedAt||left.updatedAt||left.reviewedAt||left.completedAt||left.date||leftTime);
    const b = timeOf(right.syncModifiedAt||right.updatedAt||right.reviewedAt||right.completedAt||right.date||rightTime);
    if (a !== b) return a > b ? left : right;
    if (field === 'reviews' && Number(left.interval||0) !== Number(right.interval||0)) return Number(left.interval||0) > Number(right.interval||0) ? left : right;
    return right;
  }
  function mergeMap(left={}, right={}, leftTime='', rightTime='', field='') {
    const out = {};
    for (const key of new Set([...Object.keys(left||{}),...Object.keys(right||{})])) {
      const localItem=left?.[key],remoteItem=right?.[key],winner=preferMapItem(localItem,remoteItem,leftTime,rightTime,field);
      if(field==='completions'&&localItem&&remoteItem){
        out[key]={...localItem,...remoteItem,...winner};
        for(const listField of ['catalogCandidatePhraseIds','practicedPhraseIds','newPhraseIds'])out[key][listField]=[...new Set([...(localItem[listField]||[]),...(remoteItem[listField]||[])])];
      }else out[key]=winner;
    }
    return out;
  }
  function mergeSetField(local, remote, field, syncMeta) {
    const localSet = new Set(Array.isArray(local?.[field])?local[field]:[]);
    const remoteSet = new Set(Array.isArray(remote?.[field])?remote[field]:[]);
    const ids = new Set([...localSet,...remoteSet,...Object.keys(local?.syncMeta?.[field]||{}),...Object.keys(remote?.syncMeta?.[field]||{})]);
    const result = [], tombstones = {};
    for (const id of ids) {
      const localEntry = local?.syncMeta?.[field]?.[id] || (localSet.has(id)?{value:true,at:local?.cloudUpdatedAt||''}:null);
      const remoteEntry = remote?.syncMeta?.[field]?.[id] || (remoteSet.has(id)?{value:true,at:remote?.cloudUpdatedAt||''}:null);
      if (!localEntry && !remoteEntry) continue;
      let winner;
      if (!localEntry) winner=remoteEntry;
      else if (!remoteEntry) winner=localEntry;
      else if (timeOf(localEntry.at)!==timeOf(remoteEntry.at)) winner=timeOf(localEntry.at)>timeOf(remoteEntry.at)?localEntry:remoteEntry;
      else winner=(localEntry.value||remoteEntry.value)?(localEntry.value?localEntry:remoteEntry):localEntry;
      tombstones[id]={value:!!winner.value,at:winner.at||''};
      if(winner.value) result.push(id);
    }
    syncMeta[field]=tombstones;
    return result;
  }
  function mergeStores(local, remote) {
    if (!remote) return local;
    if (!local) return remote;
    const localTime=local.cloudUpdatedAt||'',remoteTime=remote.cloudUpdatedAt||'';
    const newest=timeOf(localTime)>=timeOf(remoteTime)?local:remote;
    const syncMeta={...(local.syncMeta||{}),...(remote.syncMeta||{})};
    const merged={...remote,...local,...newest};
    for(const field of ['saved','learned','speakingPracticed','selfReportedPractice']) merged[field]=mergeSetField(local,remote,field,syncMeta);
    for(const field of ['introducedPhraseIds','activityDates']) merged[field]=[...new Set([...(local[field]||[]),...(remote[field]||[])])];
    merged.syncMeta=syncMeta;
    merged.completions=mergeMap(local.completions,remote.completions,localTime,remoteTime,'completions');
    merged.reviews=mergeMap(local.reviews,remote.reviews,localTime,remoteTime,'reviews');
    merged.contentEdits=mergeMap(local.contentEdits,remote.contentEdits,localTime,remoteTime,'contentEdits');
    const sessions=new Map();
    for(const [collection,stamp] of [[remote.sessions||[],remoteTime],[local.sessions||[],localTime]]) for(const item of collection){
      const key=keyOfSession(item); if(!(item?.id||item?.date||item?.lessonId)) continue;
      sessions.set(key,preferMapItem(sessions.get(key),item,remoteTime,stamp,'sessions'));
    }
    merged.sessions=[...sessions.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.lessonId||'').localeCompare(String(b.lessonId||'')));
    merged.activeSession=newest.activeSession||null;
    const localMigration=local.migration||{},remoteMigration=remote.migration||{};
    if(localMigration||remoteMigration) merged.migration={...remoteMigration,...localMigration,...(timeOf(localTime)>=timeOf(remoteTime)?localMigration:remoteMigration),archivedCompletions:mergeMap(localMigration.archivedCompletions,remoteMigration.archivedCompletions,localTime,remoteTime,'completions'),unresolvedIds:[...new Set([...(localMigration.unresolvedIds||[]),...(remoteMigration.unresolvedIds||[])])]};
    merged.cloudUpdatedAt=new Date(Math.max(timeOf(localTime),timeOf(remoteTime))).toISOString();
    return merged;
  }
  async function authToken() {
    const result=await state.auth.token();
    if(result?.error||!result?.data?.token) throw new Error('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');
    return result.data.token;
  }
  async function requestSync(method='GET', body=null) {
    const token=await authToken();
    const base=String(config.apiUrl).replace(/\/+$/,'');
    const result=await fetch(`${base}/sync`,{method,headers:{authorization:`Bearer ${token}`,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    let data={};try{data=await result.json();}catch{}
    if(!result.ok && result.status!==409){
      if(result.status===401) throw new Error('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');
      if(result.status===403&&data.error==='account_not_allowed'){await state.auth.signOut();state.session=null;state.user=null;throw new Error('Email này chưa được cấp quyền đồng bộ TomEng.');}
      throw new Error(data.error==='origin_not_allowed'?'Nguồn truy cập chưa được cấp quyền.':data.error==='payload_too_large'?'Dữ liệu lớn hơn giới hạn đồng bộ.':'Kết nối cloud lỗi. Thử lại khi có mạng.');
    }
    return {status:result.status,data};
  }
  function setStatus(status) { state.status=status; updateTrigger(); if(dialog.open) renderDialog(); }
  async function syncNow() {
    if(!state.user||!api)return;
    if(!navigator.onLine){state.dirty=true;setStatus('offline');return;}
    if(state.syncing){state.syncAgain=true;return;}
    state.syncing=true;setStatus('syncing');
    try{
      for(let attempt=0;attempt<4;attempt++){
        const {data:remote}=await requestSync('GET');
        const local=api.getState();
        const merged=mergeStores(local,remote.state);
        const localDiff=canonical(merged)!==canonical(local);
        if(localDiff&&!api.applyCloudState(merged)) throw new Error('Thiết bị không đủ bộ nhớ để tạo bản sao trước khi đồng bộ. Hãy tải backup rồi thử lại.');
        const current=api.getState();
        if(remote.state&&canonical(current)===canonical(remote.state)){
          state.dirty=false;state.lastSyncedAt=remote.updatedAt||new Date().toISOString();setStatus('synced');return;
        }
        const saved=await requestSync('POST',{revision:remote.revision,state:current});
        if(saved.status===409){continue;}
        state.dirty=false;state.lastSyncedAt=saved.data.updatedAt||new Date().toISOString();setStatus('synced');return;
      }
      throw new Error('Dữ liệu đang được cập nhật ở thiết bị khác. Bấm đồng bộ lại sau vài giây.');
    }catch(error){state.dirty=true;state.message=error?.message||'Chưa đồng bộ được.';state.messageType='error';setStatus(navigator.onLine?'error':'offline');}
    finally{state.syncing=false;if(state.syncAgain){state.syncAgain=false;setTimeout(syncNow,250);}if(dialog.open)renderDialog();}
  }
  function scheduleSync() {
    if(!state.user)return;
    state.dirty=true;setStatus(navigator.onLine?'pending':'offline');clearTimeout(state.timer);
    state.timer=setTimeout(syncNow,1400);
  }
  async function loadAuthClient() {
    if(state.auth)return true;
    state.loading=true;
    try{
      const sdk=await import('https://esm.sh/@neondatabase/neon-js/auth?bundle');
      state.auth=sdk.createAuthClient(config.authUrl,{fetchOptions:{credentials:'include'}});
      state.sdkReady=true;state.sdkError='';
      const sessionResult=await state.auth.getSession();
      state.session=sessionResult?.data?.session||null;state.user=state.session?.user||null;
      if(state.user)syncNow();
      return true;
    }catch(error){state.sdkError='Không tải được dịch vụ đăng nhập. Kiểm tra mạng rồi thử lại.';state.sdkReady=false;return false;}
    finally{state.loading=false;updateTrigger();if(dialog.open)renderDialog();}
  }
  async function openDialog() {
    state.message='';state.messageType='info';renderDialog();
    if(!dialog.open)dialog.showModal();
    if(!state.sdkReady&&!state.sdkError){await loadAuthClient();renderDialog();}
    else if(state.sdkError)renderDialog();
  }

  document.addEventListener('click',(event)=>{
    const button=event.target.closest?.('[data-sync-action]');if(!button)return;
    const action=button.dataset.syncAction;
    if(action==='open'){event.preventDefault();openDialog();}
    if(action==='close')closeDialog();
    if(action==='toggle-auth'){state.mode=state.mode==='sign-in'?'sign-up':'sign-in';state.message='';renderDialog();}
    if(action==='back-to-auth'){state.pendingEmail='';state.mode='sign-in';state.message='';renderDialog();}
    if(action==='retry-sdk'){state.sdkError='';state.sdkReady=false;loadAuthClient();}
    if(action==='now'){state.message='';syncNow();}
    if(action==='sign-out'){state.auth?.signOut?.().then(()=>{state.session=null;state.user=null;state.dirty=false;state.status='idle';state.lastSyncedAt='';state.message='Đã đăng xuất trên thiết bị này. Dữ liệu cục bộ vẫn còn.';renderDialog();updateTrigger();}).catch(()=>showMessage('Không đăng xuất được. Thử lại.','error'));}
  });
  dialog.addEventListener('click',(event)=>{if(event.target===dialog)closeDialog();});
  dialog.addEventListener('submit',async(event)=>{
    const form=event.target.closest?.('[data-sync-form]');if(!form)return;
    event.preventDefault();state.message='';
    const formData=new FormData(form);
    try{
      if(form.dataset.syncForm==='auth'){
        const email=String(formData.get('email')||'').trim().toLowerCase(),password=String(formData.get('password')||'');
        state.email=email;state.loading=true;renderDialog();
        if(state.mode==='sign-up'){
          const result=await state.auth.signUp.email({email,password,name:'TomEng',callbackURL:location.href});
          if(result?.error)throw new Error(result.error.message||'Chưa tạo được tài khoản.');
          state.pendingEmail=email;state.mode='sign-in';state.message='';
        }else{
          const result=await state.auth.signIn.email({email,password,rememberMe:true});
          if(result?.error)throw new Error(result.error.message||'Email hoặc mật khẩu chưa đúng.');
          const current=await state.auth.getSession();state.session=current?.data?.session||result?.data?.session||null;state.user=state.session?.user||null;
          if(!state.user)throw new Error('Đăng nhập chưa hoàn tất. Hãy xác minh email nếu vừa tạo tài khoản.');
          renderDialog();await syncNow();
        }
      }else if(form.dataset.syncForm==='verify'){
        const otp=String(formData.get('otp')||'').trim();state.loading=true;renderDialog();
        const result=await state.auth.emailOtp.verifyEmail({email:state.pendingEmail,otp});
        if(result?.error)throw new Error(result.error.message||'Mã xác minh chưa đúng hoặc đã hết hạn.');
        const current=await state.auth.getSession();state.session=current?.data?.session||result?.data?.session||null;state.user=state.session?.user||null;state.pendingEmail='';
        if(!state.user){state.mode='sign-in';state.message='Email đã xác minh. Đăng nhập để bắt đầu đồng bộ.';renderDialog();return;}
        renderDialog();await syncNow();
      }
    }catch(error){state.message=error?.message||'Chưa hoàn tất được thao tác.';state.messageType='error';}
    finally{state.loading=false;renderDialog();updateTrigger();}
  });
  window.addEventListener('tomeng:local-save',scheduleSync);
  window.addEventListener('online',()=>{if(state.user)syncNow();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.user&&state.dirty)syncNow();});
  updateTrigger();
  if(config.enabled&&config.authUrl&&config.apiUrl)loadAuthClient();
})();
