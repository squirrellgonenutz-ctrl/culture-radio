import {stations, genres} from './stations.js';
import {client, initAuth, onAccount} from './auth.js';

const $ = id => document.getElementById(id);
const read = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
const save = (key, value) => {try {localStorage.setItem(key, JSON.stringify(value));} catch {/* Private mode may disallow persistence. */}};
const favourites = new Set();
let userId=null, accountEpoch=0, syncChain=Promise.resolve();
const pendingKey=id=>`culture:pending:${id}`;
function pendingFor(id){const value=read(pendingKey(id),{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function cacheFavourites(){if(userId)save(`culture:favourites:${userId}`,[...favourites]);}
async function syncFavourites(){
  const id=userId, epoch=accountEpoch;
  if(!id||!client||!navigator.onLine)return;
  try{
    const pending=pendingFor(id);
    for(const [stationId,enabled] of Object.entries(pending)){
      if(userId!==id||epoch!==accountEpoch)return;
      if(!stations.some(s=>s.id===stationId))continue;
      const {error}=enabled?await client.from('radio_favourites').upsert({user_id:id,station_id:stationId},{onConflict:'user_id,station_id',ignoreDuplicates:true}):await client.from('radio_favourites').delete().eq('user_id',id).eq('station_id',stationId);
      if(error)throw error;
      const latest=pendingFor(id);if(latest[stationId]===enabled){delete latest[stationId];save(pendingKey(id),latest);}
    }
    const {data,error}=await client.from('radio_favourites').select('station_id').eq('user_id',id);
    if(error)throw error;if(userId!==id||epoch!==accountEpoch)return;
    favourites.clear();for(const row of data||[])if(stations.some(s=>s.id===row.station_id))favourites.add(row.station_id);
    for(const [stationId,enabled]of Object.entries(pendingFor(id)))enabled?favourites.add(stationId):favourites.delete(stationId);
    cacheFavourites();$('sync-status').textContent=Object.keys(pendingFor(id)).length?'Saving favourites…':'';render();
  }catch{if(userId===id&&epoch===accountEpoch)$('sync-status').textContent='Favourites saved on this device. Cloud sync will retry when you reconnect.';}
}
function queueSync(){syncChain=syncChain.catch(()=>{}).then(syncFavourites);}
onAccount(user=>{
  if(userId===user?.id)return;
  pause();accountEpoch++;userId=user?.id||null;favourites.clear();onlyFavourites=false;genre='All';$('search').value='';
  if(userId){const cached=read(`culture:favourites:${userId}`,[]);if(Array.isArray(cached))for(const id of cached)if(stations.some(s=>s.id===id))favourites.add(id);queueSync();}
  $('sync-status').textContent='';renderGenres();render();
});
let selected = stations.find(s => s.id === read('culture:station', 'flex')) || stations[0];
let genre = 'All', onlyFavourites = false, state = 'ready', audio = null, generation = 0;
let wantsPlayback = false, retryCount = 0, retryTimer, connectionTimer;
const storedVolume = read('culture:volume', 0.8);
let volume = typeof storedVolume === 'number' && Number.isFinite(storedVolume) ? Math.max(0, Math.min(1, storedVolume)) : 0.8;

function visibleStations() {
  const query = $('search').value.toLowerCase().trim();
  return stations.filter(s => (!onlyFavourites || favourites.has(s.id)) && (genre === 'All' || s.genres.includes(genre)) && `${s.name} ${s.genres.join(' ')} ${s.description}`.toLowerCase().includes(query));
}
function favouriteButton(button, station) {
  const saved = favourites.has(station.id);
  button.textContent = saved ? '♥' : '♡';
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${saved ? 'Remove' : 'Add'} ${station.name} ${saved ? 'from' : 'to'} favourites`);
}
function render() {
  const list = visibleStations();
  $('station-count').textContent = `${list.length} ${list.length === 1 ? 'STATION' : 'STATIONS'}`;
  $('favourite-count').textContent = favourites.size;
  $('all-tab').classList.toggle('active', !onlyFavourites);
  $('favourites-tab').classList.toggle('active', onlyFavourites);
  $('all-tab').setAttribute('aria-pressed', String(!onlyFavourites));
  $('favourites-tab').setAttribute('aria-pressed', String(onlyFavourites));
  $('empty').hidden = list.length !== 0;
  $('empty-message').textContent = onlyFavourites && !favourites.size ? 'Tap a heart to save a station to this phone.' : genre === 'Trance' ? 'No dedicated Trance station in this first collection. Try another genre.' : 'Try another search or genre.';
  $('station-grid').replaceChildren(...list.map(s => {
    const card = document.createElement('article');
    card.className = `station${s.id === selected.id ? ' selected' : ''}`;
    card.dataset.station = s.id;
    // The catalogue is bundled, trusted data; search text is never interpolated into HTML.
    card.innerHTML = `<button class="station-select" aria-label="Play ${s.name}" aria-pressed="${s.id === selected.id}"><div class="tile-art" style="--tint:${s.tint}"><span class="tile-index">0${stations.indexOf(s)+1}</span><img src="${s.art}" alt="" width="256" height="256"><span class="tile-action" aria-hidden="true">${s.id === selected.id && state === 'playing' ? '▥' : '▶'}</span></div><h3>${s.name}</h3><p>${s.genres.slice(0,2).join(' · ')}</p></button><button class="heart icon-button"></button>`;
    card.querySelector('.station-select').addEventListener('click', () => select(s));
    const heart = card.querySelector('.heart');
    favouriteButton(heart, s);
    heart.addEventListener('click', () => { toggleFavourite(s); const replacement = document.querySelector(`[data-station="${s.id}"] .heart`); (replacement || $('favourites-tab')).focus(); });
    return card;
  }));
  $('now-name').textContent = selected.name;
  $('now-description').textContent = selected.description;
  $('now-genres').textContent = selected.genres.slice(0,3).join(' · ');
  $('now-art').src = selected.art;
  $('now-art').alt = `${selected.name} artwork`;
  $('station-site').href = selected.website;
  $('quality').textContent = selected.quality;
  favouriteButton($('now-favourite'), selected);
  $('play').setAttribute('aria-label', wantsPlayback ? 'Pause' : 'Play');
  $('play').firstElementChild.textContent = wantsPlayback ? 'Ⅱ' : '▶';
  document.body.classList.toggle('playing', state === 'playing');
}
function setState(next, message) {
  state = next;
  $('player-status').textContent = message;
  $('status-pill').textContent = {ready:'READY',playing:'● LIVE',loading:'TUNING IN',paused:'PAUSED',error:'UNAVAILABLE',offline:'OFFLINE',retry:'RECONNECTING'}[next];
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = next === 'playing' ? 'playing' : 'paused';
  render();
}
function toggleFavourite(s) {
  if(!userId)return;
  favourites.has(s.id) ? favourites.delete(s.id) : favourites.add(s.id);
  const pending=pendingFor(userId);pending[s.id]=favourites.has(s.id);save(pendingKey(userId),pending);cacheFavourites();render();
  $('sync-status').textContent=navigator.onLine?'Saving favourites…':'Favourites saved on this device. They’ll sync when you reconnect.';queueSync();
}
function dispose() {
  generation++;
  clearTimeout(retryTimer); clearTimeout(connectionTimer);
  if (audio) {const old = audio; audio = null; old.pause(); old.removeAttribute('src'); old.load();}
}
function mediaMetadata() {
  if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
  navigator.mediaSession.metadata = new MediaMetadata({title:selected.name, artist:'Live radio · Culture Radio', album:selected.description, artwork:[{src:new URL(selected.art, location.href).href}]});
}
function fail(message) {
  if (!wantsPlayback) return;
  dispose();
  if (!navigator.onLine) {setState('offline', 'Connection lost. Playback will retry when you’re back online.');return;}
  if (retryCount < 2) {
    const delay = ++retryCount * 2500;
    setState('retry', `Signal interrupted. Reconnecting (${retryCount}/2)…`);
    retryTimer = setTimeout(() => start(false), delay);
  } else {wantsPlayback = false;setState('error', message || 'This stream is unavailable. Press play to retry or choose another station.');}
}
function start(resetRetries = true) {
  if(!userId)return;
  dispose();
  wantsPlayback = true;
  if (resetRetries) retryCount = 0;
  if (!navigator.onLine) {setState('offline', 'You’re offline. Reconnect to listen live.');return;}
  const token = generation;
  const current = new Audio(); audio = current;
  current.preload = 'none'; current.volume = volume;
  // Do not set crossOrigin: these public audio feeds do not all expose CORS headers.
  current.src = selected.url;
  const valid = () => token === generation && audio === current && wantsPlayback;
  const timeout = () => {clearTimeout(connectionTimer);connectionTimer = setTimeout(() => {if (valid()) fail('The station took too long to connect. Press play to retry.');}, 20000);};
  current.addEventListener('playing', () => {if (!valid()) return;clearTimeout(connectionTimer);setState('playing', 'Live from the station. You’re locked in.');});
  current.addEventListener('waiting', () => {if (valid()) {setState('loading', 'Buffering the live stream…');timeout();}});
  current.addEventListener('stalled', () => {if (valid()) timeout();});
  current.addEventListener('error', () => {if (valid()) fail();});
  current.addEventListener('ended', () => {if (valid()) fail('The broadcast ended. Press play to reconnect.');});
  current.addEventListener('pause', () => {if (valid() && !current.ended && !current.error) {wantsPlayback = false;clearTimeout(connectionTimer);setState('paused', 'Paused by your device. Press play to return to live.');}});
  setState('loading', 'Connecting to the live broadcast…');mediaMetadata();timeout();
  current.play().catch(error => {
    if (!valid()) return;
    if (error.name === 'NotAllowedError') {dispose();wantsPlayback = false;setState('paused', 'Tap play to allow audio on this device.');}
    else if (error.name !== 'AbortError') fail();
  });
}
function pause() {wantsPlayback = false;dispose();setState('paused', 'Paused. Press play to return to live.');}
function select(s) {selected=s;save('culture:station',s.id);start();}
function step(direction) {
  // Hardware controls follow the current visible collection; an empty filter falls back to all stations.
  const filtered = visibleStations();const list = filtered.length ? filtered : stations;
  const index = list.findIndex(s => s.id === selected.id);
  select(list[index < 0 ? (direction > 0 ? 0 : list.length-1) : (index+direction+list.length)%list.length]);
}
$('play').addEventListener('click', () => wantsPlayback ? pause() : start());
$('previous').addEventListener('click', () => step(-1));
$('next').addEventListener('click', () => step(1));
$('now-favourite').addEventListener('click', () => toggleFavourite(selected));
$('search').addEventListener('input',render);
$('all-tab').addEventListener('click', () => {onlyFavourites=false;render();});
$('favourites-tab').addEventListener('click', () => {onlyFavourites=true;render();});
function renderGenres() {
  $('genres').replaceChildren(...genres.map(g => {const button=document.createElement('button');button.className=`genre${g===genre?' active':''}`;button.textContent=g;button.setAttribute('aria-pressed',String(g===genre));button.addEventListener('click',()=>{genre=g;renderGenres();render();[...$('genres').children].find(b=>b.textContent===g).focus();});return button;}));
}
$('clear').addEventListener('click',()=>{onlyFavourites=false;genre='All';$('search').value='';renderGenres();render();$('search').focus();});
$('volume').value=volume;$('volume-value').value=`${Math.round(volume*100)}%`;
$('volume').addEventListener('input', e=>{volume=Number(e.target.value);if(audio)audio.volume=volume;$('volume-value').value=`${Math.round(volume*100)}%`;save('culture:volume',volume);});
const network=()=>{$('network').hidden=navigator.onLine;if(!navigator.onLine&&wantsPlayback){dispose();setState('offline','Connection lost. Playback will retry when you’re back online.');}else if(navigator.onLine&&wantsPlayback&&state==='offline')start();};
window.addEventListener('offline',network);window.addEventListener('online',network);
window.addEventListener('online',queueSync);
window.addEventListener('focus',queueSync);
if ('mediaSession' in navigator) {
  for (const [action,handler] of Object.entries({play:()=>start(),pause,stop:pause,previoustrack:()=>step(-1),nexttrack:()=>step(1)})) {try {navigator.mediaSession.setActionHandler(action,handler);} catch {/* Unsupported actions vary by browser. */}}
}
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('install').hidden=true;});
$('install').addEventListener('click',async()=>{if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;}else $('help-dialog').showModal();});
$('help').addEventListener('click',()=>$('help-dialog').showModal());
if (matchMedia('(display-mode: standalone)').matches) $('install').hidden=true;
if ('serviceWorker' in navigator) window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{console.warn('Offline shell could not be installed. Live playback remains available.');});});
renderGenres();render();network();
initAuth();
