'use strict';
/* CHamorU Private Family Voice Studio. All audio stays in the browser unless exported by user. */
(function(global){
const WORDS=[['hafa','Håfa adai!','Hello'],['thanks','Si Yu’os ma’åse’.','Thank you'],['yes','Hunggan.','Yes'],['no','Åhe’.','No'],['mother','Nåna','Mother'],['father','Tåta','Father'],['parent','Saina','Parent'],['child','Påtgon','Child'],
 ['howareyou','Håfa tatatmanu hao?','How are you? · dialogue'],
 ['imfine','Mamaolek ha’ yu’.','I am fine · dialogue'],
 ['goodbye','Adios.','Goodbye · dialogue'],
 ['canhelp','Kao siña un ayuda yo’?','Can you help me? · dialogue, wording pending fluent review'],
 ['thanks-alt','Si Yu’us ma’åse’.','Thank you · existing dialogue variant, spelling pending fluent review'],
 ['welcome','Buen probechu.','You are welcome · dialogue, spelling pending fluent review']];
const DB='chamoru-family-voice-v1',MAX=3*1024*1024;
let dbPromise=null,rec=null,stream=null,parts=[],currentId=null,limitTimer=null,player=null,audioUrl=null,playSeq=0,micSeq=0,pendingMic=false,message='',audioTimer=null;
const clipCache=new Map();let cacheReady=false,cachePromise=null;
const SOUND_CHECK_KEY='chamoru-device-audio-check-v1';
let lastPlayedId=null;const soundChecks=(()=>{
 try{return JSON.parse(localStorage.getItem(SOUND_CHECK_KEY)||'{}')||{}}catch(e){return {}}
})();
function confirmSound(heard){
 if(!lastPlayedId)return;
 const id=lastPlayedId;const word=phrase(id)?.[1]||'this clip';
 soundChecks[id]={heard:!!heard,checkedAt:new Date().toISOString()};
 try{localStorage.setItem(SOUND_CHECK_KEY,JSON.stringify(soundChecks))}catch(e){}
 const area=document.getElementById('voicePlaybackCheck');
 if(area)area.hidden=true;
 status(heard?'Audio heard for '+word+'. This checks playback only, not CHamoru pronunciation.':'Recording playback was silent for '+word+'. Try recording again, then Play. Audio mastery stays unavailable.');
 render();
}
function offerPlaybackCheck(id){
 if(!document.getElementById('voiceStudioStatus'))return;
 lastPlayedId=id;const check=document.getElementById('voicePlaybackCheck');
 const word=document.getElementById('voicePlaybackWord');
 if(word)word.textContent=phrase(id)?.[1]||'this phrase';
 if(check)check.hidden=false;
}
function phrase(id){return WORDS.find(w=>w[0]===id)}
function status(s){message=s;const el=document.getElementById('voiceStudioStatus');if(el)el.textContent=s}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function database(){
 if(dbPromise)return dbPromise;
 if(!global.indexedDB)return Promise.reject(Error('Local recording storage unavailable'));
 dbPromise=new Promise((resolve,reject)=>{
  const q=indexedDB.open(DB,1);
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('clips'))q.result.createObjectStore('clips',{keyPath:'id'})};
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||Error('Storage failed'));q.onblocked=()=>reject(Error('Close other CHamorU tabs'));
 }).catch(e=>{dbPromise=null;throw e});
 return dbPromise;
}
async function stored(id){
 if(!phrase(id))return null;
 const db=await database();
 return new Promise((resolve,reject)=>{const q=db.transaction('clips').objectStore('clips').get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error)});
}
async function storedAll(){
 const db=await database();
 return new Promise((resolve,reject)=>{const q=db.transaction('clips').objectStore('clips').getAll();q.onsuccess=()=>resolve((q.result||[]).filter(a=>phrase(a.id)));q.onerror=()=>reject(q.error)});
}
async function save(id,blob){
 if(!phrase(id)||!blob||!blob.size||blob.size>MAX)throw Error('Recording must be smaller than 3 MB');
 const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('clips','readwrite');
  tx.objectStore('clips').put({id,blob,mime:blob.type||'audio/webm',savedAt:new Date().toISOString()});
  tx.oncomplete=()=>{clipCache.set(id,blob);resolve()};tx.onerror=()=>reject(tx.error||Error('Storage failed'));tx.onabort=()=>reject(tx.error||Error('Save interrupted'));
 });
}
async function erase(id){
 if(!phrase(id))return;
 if(!global.confirm('Delete your saved recording of '+phrase(id)[1]+'?'))return;
 stopAudio();
 try{const db=await database();await new Promise((res,rej)=>{const tx=db.transaction('clips','readwrite');tx.objectStore('clips').delete(id);tx.oncomplete=()=>{clipCache.delete(id);res()};tx.onerror=()=>rej(tx.error)});status('Recording deleted.');await render()}
 catch(e){status('Delete failed: '+e.message)}
}

// Eagerly load small saved blobs so a tap starts playback synchronously.
// Android may drop user-activation privileges after an IndexedDB await.
function warm(){
 if(cachePromise)return cachePromise;
 cachePromise=storedAll().then(rows=>{
  for(const item of rows){if(item&&item.blob&&item.blob.size&&item.blob.size<=MAX)clipCache.set(item.id,item.blob)}
  cacheReady=true;return clipCache.size;
 }).catch(e=>{cachePromise=null;cacheReady=false;throw e});
 return cachePromise;
}
function report(text,target='audioStatus'){
 const e=document.getElementById(target);
 if(e)e.textContent=text;
 else status(text);
}
function stopAudio(){
 playSeq++;
 if(audioTimer){clearTimeout(audioTimer);audioTimer=null}
 if(player){try{player.pause();player.removeAttribute('src');player.load()}catch(e){}player=null}
 if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}
}
function wordId(word){
 const normalize=s=>String(s||'').trim().toLocaleLowerCase().replace(/['’ʼ]/g,'’').replace(/[.!?。]+$/g,'').trim();
 const w=normalize(word);
 const entry=WORDS.find(x=>normalize(x[1])===w);
 return entry?entry[0]:null;
}
function playCached(id,slow,target='voiceStudioStatus'){
 const item=clipCache.get(id);
 if(!item){report('No family recording for '+(phrase(id)?.[1]||'this phrase')+'. Open Family Voice Studio to record one.',target);return false}
 // This synchronous method is called directly from the click handler.
 stopAudio();const token=playSeq;
 try{
  audioUrl=URL.createObjectURL(item);
  player=new Audio(audioUrl);player.volume=1;player.playbackRate=slow?.8:1;player.preload='auto';
  let started=false;
  const close=(msg)=>{if(token!==playSeq)return;stopAudio();report(msg,target)};
  player.onplaying=()=>{if(token!==playSeq)return;started=true;if(audioTimer){clearTimeout(audioTimer);audioTimer=null}report('Playing saved family recording (pronunciation not independently reviewed).',target);if(target==='voiceStudioStatus')offerPlaybackCheck(id)};
  player.onended=()=>close('Recording finished. Replay it or continue learning.');
  player.onerror=()=>close('Saved recording could not be decoded by this browser. Make a fresh recording in Chrome.');
  audioTimer=setTimeout(()=>{if(token===playSeq&&!started)close('Recording did not begin after 7 seconds. Check the audio format or record again.')},7000);
  const promise=player.play();
  if(promise&&promise.catch)promise.catch(e=>close('Recording playback blocked: '+(e.name||e.message||'unknown error')+'. Try again.'));
  report('Starting saved family voice…',target);return true;
 }catch(e){stopAudio();report('Could not start recording: '+e.message,target);return false}
}
function replay(id,slow=false){return playCached(id,slow,'voiceStudioStatus')}
function playWord(word,fallback,slow){
 const id=wordId(word);
 if(!id){report('A family recording is not yet offered for this phrase. Written practice still works.');return false}
 if(!cacheReady){
  report('Loading your saved family voices. Tap Hear it again when loading finishes.');
  warm().then(()=>report('Family voices loaded. Tap Hear it again.')).catch(e=>report('Cannot load saved voices: '+e.message));
  return false;
 }
 return playCached(id,slow,'audioStatus');
}
function playLine(word,slow=false,target='audioStatus'){
 const id=wordId(word);
 if(!id){report('No saved voice entry for this complete phrase. Read the CHamoru text and continue without audio.',target);return false}
 if(!cacheReady){
  report('Preparing the family voice library. Tap Replay again once ready.',target);
  warm().then(()=>report('Voice library ready. Tap Replay again.',target)).catch(e=>report('Voice library unavailable: '+e.message,target));
  return false;
 }
 return playCached(id,slow,target);
}
function clearMic(){if(limitTimer){clearTimeout(limitTimer);limitTimer=null}if(stream){try{stream.getTracks().forEach(t=>t.stop())}catch(e){}stream=null}}
async function start(id){
 if(!phrase(id)||currentId){status('Finish the current recording first.');return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Recording needs Chrome with microphone permission.');return}
 stopAudio();currentId=id;parts=[];pendingMic=true;const request=++micSeq;
 status('Waiting for microphone permission…');render();
 try{
  const acquired=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  if(request!==micSeq||currentId!==id){try{acquired.getTracks().forEach(t=>t.stop())}catch(e){}return}
  stream=acquired;pendingMic=false;
  const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'];
  const mime=types.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t));
  rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
  rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  rec.onerror=()=>{status('Microphone error. Try Chrome.');currentId=null;rec=null;clearMic();render()};
  rec.onstop=async()=>{
   const idToSave=currentId,type=rec&&rec.mimeType||mime||'audio/webm';
   currentId=null;rec=null;clearMic();
   const blob=new Blob(parts,{type});parts=[];
   if(!idToSave){status('Recording ended without saving.');render();return}
   try{await save(idToSave,blob);status('Saved '+phrase(idToSave)[1]+'. Tap Play to check it.')}
   catch(e){status('Recording not saved: '+e.message)}
   render();
  };
  rec.start(250);status('Recording '+phrase(id)[1]+'… tap Stop & Save when done.');render();
  limitTimer=setTimeout(()=>{if(rec&&rec.state==='recording'){status('20-second limit. Saving…');finish()}},20000);
 }catch(e){if(request!==micSeq)return;pendingMic=false;currentId=null;rec=null;clearMic();status('Microphone unavailable: '+(e.name||e.message)+'. Allow the microphone in Chrome settings.');render()}
}
function cancel(){if(!pendingMic)return;micSeq++;pendingMic=false;currentId=null;parts=[];status('Microphone request cancelled. Dismiss any browser permission prompt.');render()}
function finish(){if(rec&&rec.state!=='inactive')try{rec.stop()}catch(e){status('Could not stop: '+e.message);currentId=null;clearMic()}}
const asDataURL=blob=>new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(Error('Cannot encode audio'));reader.readAsDataURL(blob)});
async function exportAll(){
 try{status('Preparing voice pack…');const clips=await storedAll();if(!clips.length){status('Record at least one word before exporting.');return}
  const data=[];for(const clip of clips)data.push({id:clip.id,data:await asDataURL(clip.blob)});
  const json=JSON.stringify({format:'CHamorU-voicepack-v1',clips:data});
  if(json.length>60*1024*1024)throw Error('Pack too large');
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const a=document.createElement('a');a.download='CHamorU-Family-Voice-Pack.json';a.href=url;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);status('Voice pack download started. Share it only with family you trust.');
 }catch(e){status('Export error: '+e.message)}
}
async function importAll(input){
 const file=input.files&&input.files[0];if(!file)return;
 try{
  if(file.size>60*1024*1024)throw Error('File exceeds 60 MB');
  const pack=JSON.parse(await file.text());
  if(pack.format!=='CHamorU-voicepack-v1'||!Array.isArray(pack.clips)||pack.clips.length>WORDS.length)throw Error('Wrong voice-pack format');
  if(!confirm('Import '+pack.clips.length+' voice recordings? Existing matching words will be replaced.'))return;
  let count=0;
  for(const entry of pack.clips){
   if(!entry||!phrase(entry.id)||typeof entry.data!=='string'||entry.data.length>MAX*1.5)continue;
   const match=entry.data.match(/^data:(audio\/(?:webm|mp4|ogg|wav|mpeg));base64,([A-Za-z0-9+/=]+)$/i);if(!match)continue;
   const raw=atob(match[2]);if(raw.length<64||raw.length>MAX)continue;
   const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   await save(entry.id,new Blob([bytes],{type:match[1]}));count++;
  }
  status('Imported '+count+' audio recording(s) to this device.');await render();
 }catch(e){status('Import error: '+e.message)}finally{input.value=''}
}
async function render(){
 const root=document.getElementById('voiceStudioList');if(!root)return;
 let have=new Set();try{have=new Set((await storedAll()).map(x=>x.id))}catch(e){status('Local storage unavailable: '+e.message)}
 root.innerHTML=WORDS.map(w=>{
  const on=currentId===w[0],saved=have.has(w[0]),heard=soundChecks[w[0]];
  return '<article class="chvoice-item"><div><strong>'+escapeHTML(w[1])+'</strong><div class="small muted">'+escapeHTML(w[2])+' · '+(saved?'Saved on this phone':'No recording yet')+(heard?' · Your playback check: '+(heard.heard?'Heard':'Silent'):'')+'</div></div><div class="chvoice-actions">'+
    (on?(pendingMic?'<button class="secondary" onclick="CHVoice.cancel()">Cancel microphone request</button>':'<button class="primary" onclick="CHVoice.finish()">■ Stop & Save</button>'):'<button class="secondary" onclick="CHVoice.start(\''+w[0]+'\')" '+(currentId?'disabled':'')+'>● Record</button>')+
    '<button class="secondary" onclick="CHVoice.replay(\''+w[0]+'\')" '+(!saved||currentId?'disabled':'')+'>▶ Play</button>'+
    '<button class="secondary" onclick="CHVoice.erase(\''+w[0]+'\')" '+(!saved||currentId?'disabled':'')+'>Delete</button></div></article>';
 }).join('');
 status(message||'Tap Record, speak, then Stop & Save. Play it back to check.');
}
function open(){
 if(currentId){status('Finish recording before leaving.');return}
 stopAudio();if(typeof stop==='function')stop();screen='voiceStudio';
 APP.innerHTML=guideNav('practice')+'<section class="panel chvoice-panel"><div class="sectionLabel">CHAMORU FAMILY VOICE STUDIO</div><h2>🎙️ Record our language</h2>'+
 '<p>Record a family speaker saying the words and use the recordings in your lessons. This does not need the silent phone voice engine.</p>'+
 '<p class="small muted">Private by default: recordings are saved only in this browser. They are never uploaded automatically. Family recordings are not independently certified pronunciation.</p>'+
 '<p id="voiceStudioStatus" class="chvoice-status" role="status">Opening your voice library…</p>'+
 '<div id="voicePlaybackCheck" class="chvoice-confirm" hidden><strong>Could you hear <span id="voicePlaybackWord">the recording</span>?</strong><p class="small muted">This is a speaker test, not a pronunciation grade.</p><div class="btnrow"><button class="secondary" onclick="CHVoice.confirmSound(true)">Yes, I heard it</button><button class="secondary" onclick="CHVoice.confirmSound(false)">Still silent</button></div></div>'+
 '<div id="voiceStudioList" class="chvoice-list"></div>'+
 '<div class="chvoice-transfer"><h3>Share with another family phone</h3><p class="small muted">Export a voice pack and send the JSON file yourself, then import on another device.</p>'+
 '<div class="btnrow"><button class="secondary" onclick="CHVoice.exportAll()">↓ Export voices</button><label class="chvoice-import secondary">↑ Import voices<input type="file" accept=".json,application/json" onchange="CHVoice.importAll(this)"></label></div></div>'+
 '</section><div class="stickybar"><button class="secondary" onclick="guidedPractice()">← Back</button><button class="primary" onclick="continueLearning()">NEXT: Continue learning →</button></div>';
 render();
}

// Don't leave the microphone open while moving to another learning screen.
if(document.addEventListener)document.addEventListener('click',function(ev){
 if(!currentId)return;
 const target=ev.target;
 if(target&&target.closest&&target.closest('.guide-nav, .stickybar')){
  ev.preventDefault();ev.stopImmediatePropagation();status('Tap Stop & Save before leaving this screen.');
 }
},true);
if(global.addEventListener)global.addEventListener('pagehide',function(){
 micSeq++;pendingMic=false;
 // Preserve the existing stop-and-save attempt for a recording already in progress.
 // Only invalidate a permission prompt that has not created a recorder yet.
 if(!rec)currentId=null;
 if(rec&&rec.state==='recording'){try{rec.stop()}catch(e){}}
 clearMic();stopAudio();
});

warm().catch(()=>{});
global.CHVoice={open,render,start,cancel,finish,replay,erase,exportAll,importAll,playWord,playLine,wordId,warm,stored,save,storedAll,stopAudio,phrase,confirmSound};
global.voiceStudio=open;
global.playVocab=playWord;
})(window);
