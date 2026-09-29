// Bump VERSION on every shell/catalogue change. New versions activate after all old tabs close.
const VERSION='v3';
const PREFIX=`culture-radio:${self.registration.scope}:`;
const CACHE=PREFIX+VERSION;
const SHELL=['./','./index.html','./styles.css','./app.js','./auth.js','./config.js','./vendor/supabase.js','./stations.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/flex.png','./assets/centreforce.png','./assets/rinse.svg','./assets/kool.svg','./assets/pointblank.webp','./assets/ukbass.png','./assets/eruption.png','./assets/sub.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Never intercept or cache radio audio, cross-origin traffic, or byte ranges.
  if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('range')||request.destination==='audio')return;
  if(!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request,{ignoreSearch:request.mode==='navigate'});
    if(cached)return cached;
    try{return await fetch(request);}catch(error){if(request.mode==='navigate')return await cache.match('./index.html');throw error;}
  })());
});
