const CACHE_NAME='veronza-shell-v65';
const SHELL=['./','./index.html','./app.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Pre-cache the app shell so the installed Veronza icon can load its
    // current version without opening Safari again.
    await cache.addAll(SHELL.map(path=>new Request(path,{cache:'reload'})));
    // Do NOT skipWaiting here. The Veronza UI asks the user to update first.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('veronza-shell-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING'){
    self.skipWaiting();
    return;
  }
  if(event.data?.type==='GET_VERSION' && event.ports && event.ports[0]){
    event.ports[0].postMessage({version:CACHE_NAME});
  }
});

self.addEventListener('fetch', event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  const core=/\/(index\.html|app\.js|sw\.js|manifest\.webmanifest)$/.test(url.pathname);

  if(req.mode==='navigate'||core){
    // Always try the server first for the newest Veronza build. If the
    // connection is unavailable, serve the shell cached by this SW.
    event.respondWith(
      fetch(new Request(req,{cache:'no-store'}))
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE_NAME).then(c=>c.put(req,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached=>cached||fetch(req).then(res=>{
        if(res&&res.ok){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return res;
      }))
    );
  }
});
