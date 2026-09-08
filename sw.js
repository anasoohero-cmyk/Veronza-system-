const CACHE_NAME='V85';
// V77 real update progress
const SHELL=['./','./index.html','./app.js','./sw.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    let done=0;
    for(const url of SHELL){
      const response=await fetch(new Request(url,{cache:'reload'}));
      if(!response.ok) throw new Error('Failed to update '+url);
      await cache.put(url,response.clone());
      done++;
      const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      clients.forEach(client=>client.postMessage({type:'UPDATE_PROGRESS',done,total:SHELL.length,detail:`جاري تحديث ملفات Veronza (${done}/${SHELL.length})`}));
    }
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('V')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
  if(event.data?.type==='GET_VERSION'&&event.ports?.[0]) event.ports[0].postMessage({version:CACHE_NAME});
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  const isNavigation=req.mode==='navigate';
  const isCore=['/','/index.html','/app.js','/sw.js','/manifest.webmanifest','/apple-touch-icon.png','/icon-192.png','/icon-512.png'].includes(url.pathname);
  if(isNavigation||isCore){
    event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy));}
      return response;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(['style','script','image','font'].includes(req.destination)){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok)caches.open(CACHE_NAME).then(c=>c.put(req,response.clone()));
      return response;
    })));
  }
});