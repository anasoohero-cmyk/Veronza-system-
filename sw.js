const CACHE_NAME='veronza-shell-v25';
const SHELL=['./','./index.html','./app.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  // New version downloads and stays waiting until the user taps "تحديث الآن".
  event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING'){
    self.skipWaiting();
    return;
  }
  if(event.data?.type==='GET_VERSION' && event.ports && event.ports[0]){
    event.ports[0].postMessage({version:CACHE_NAME});
  }
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const core=/\/(index\.html|app\.js|sw\.js|manifest\.webmanifest)$/.test(url.pathname);

  if(req.mode==='navigate'||core){
    event.respondWith(
      fetch(new Request(req,{cache:'no-store'}))
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE_NAME).then(c=>c.put(req,copy));
          }
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
  }else{
    event.respondWith(
      caches.match(req).then(cached=>cached||fetch(req).then(res=>{
        if(res&&res.ok){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy));
        }
        return res;
      }))
    );
  }
});
