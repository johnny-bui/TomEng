const CACHE = 'tomeng-v20-native';
const SHELL = ['./','./index.html','./style.css?v=3.5.1','./app.js?v=3.5.1','./legacy-v2-fingerprints.js?v=3.5.1','./data.js?v=3.5.1','./meta.js?v=3.5.1','./legacy-lesson-plan-v3.js?v=3.5.1','./legacy-lesson-plan-v3_1.js?v=3.5.1','./legacy-lesson-plan-v3_2.js?v=3.5.1','./legacy-lesson-plan-v3_3.js?v=3.5.1','./sync.css?v=3.5.1','./sync-config.js?v=3.5.1','./sync-merge.js?v=3.5.1','./cloud-sync.js?v=3.5.1','./manifest.webmanifest?v=3.5.1','./logo-tomeng.png?v=3.5.1','./icon-192.png?v=3.5.1','./icon-512.png?v=3.5.1'];
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith('tomeng-')&&key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',(event)=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then((response)=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached)=>cached||fetch(event.request).then((response)=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then((cache)=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
