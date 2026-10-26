'use strict';
/* CHamorU Private Family Voice Studio. All audio stays in the browser unless exported by user. */
(function(global){
const WORDS=[['hafa','Håfa adai!','Hello'],['thanks','Si Yu’os ma’åse’.','Thank you'],['yes','Hunggan.','Yes'],['no','Åhe’.','No'],['mother','Nåna','Mother'],['father','Tåta','Father'],['parent','Saina','Parent'],['child','Påtgon','Child']];
const DB='chamoru-family-voice-v1',MAX=3*1024*1024;
let dbPromise=null,rec=null,stream=null,parts=[],currentId=null,limitTimer=null,player=null,audioUrl=null,playSeq=0,message='';
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
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Storage failed'));tx.onabort=()=>reject(tx.error||Error('Save interrupted'));
 });
}
async function erase(id){
 if(!phrase(id))return;
 if(!global.confirm('Delete your saved recording of '+phrase(id)[1]+'?'))return;
 stopAudio();
 try{const db=await database();await new Promise((res,rej)=>{const tx=db.transaction('clips','readwrite');tx.objectStore('clips').delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});status('Recording deleted.');await render()}
 catch(e){status('Delete failed: '+e.message)}
}
function stopAudio(){
 playSeq++;
 if(player){try{player.pause();player.removeAttribute('src');player.load()}catch(e){}player=null}
 if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}
}
async function replay(id,slow){
 const seq=++playSeq;let item;
 try{item=await stored(id)}catch(e){status('Could not read recording: '+e.message);return}
 if(seq!==playSeq)return;
 if(!item){status('No recording for '+phrase(id)[1]+' yet.');return}
 stopAudio();const active=playSeq;
 try{
  audioUrl=URL.createObjectURL(item.blob);player=new Audio(audioUrl);player.playbackRate=slow?.8:1;player.volume=1;
  player.onended=()=>{if(active===playSeq){stopAudio();status('Playback finished.')}};player.onerror=()=>{if(active===playSeq){stopAudio();status('Audio file could not play. Record again in Chrome.')}};
  const promise=player.play();if(promise&&promise.catch)promise.catch(e=>{if(active===playSeq){stopAudio();status('Sound blocked: '+(e.name||e.message)+'. Try Chrome.')}});
  status('Playing the family recording…');
 }catch(e){if(active===playSeq){stopAudio();status('Audio error: '+e.message)}}
}
async function playWord(word,fallback,slow){
 const match=WORDS.find(w=>w[1]===word);
 if(match){
  try{if(await stored(match[0])){replay(match[0],slow);return}}catch(e){}
 }
 if(typeof lessonAudioStatus==='function')lessonAudioStatus('No family voice saved yet. Trying unverified demonstration audio.');
 if(match&&match[0]==='hafa'&&typeof playStoredGreeting==='function')playStoredGreeting(slow);
 else if(typeof play==='function')play(fallback,slow);
}
function clearMic(){if(limitTimer){clearTimeout(limitTimer);limitTimer=null}if(stream){try{stream.getTracks().forEach(t=>t.stop())}catch(e){}stream=null}}
async function start(id){
 if(!phrase(id)||currentId){status('Finish the current recording first.');return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){status('Recording needs Chrome with microphone permission.');return}
 stopAudio();currentId=id;parts=[];
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  if(currentId!==id){clearMic();return}
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
 }catch(e){currentId=null;rec=null;clearMic();status('Microphone unavailable: '+(e.name||e.message)+'. Allow the microphone in Chrome settings.');render()}
}
function finish(){if(rec&&rec.state!=='inactive')try{rec.stop()}catch(e){status('Could not stop: '+e.message);currentId=null;clearMic()}}
const asDataURL=blob=>new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(Error('Cannot encode audio'));reader.readAsDataURL(blob)});
async function exportAll(){
 try{status('Preparing voice pack…');const clips=await storedAll();if(!clips.length){status('Record at least one word before exporting.');return}
  const data=[];for(const clip of clips)data.push({id:clip.id,data:await asDataURL(clip.blob)});
  const json=JSON.stringify({format:'CHamorU-voicepack-v1',clips:data});
  if(json.length>40*1024*1024)throw Error('Pack too large');
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const a=document.createElement('a');a.download='CHamorU-Family-Voice-Pack.json';a.href=url;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);status('Voice pack download started. Share it only with family you trust.');
 }catch(e){status('Export error: '+e.message)}
}
async function importAll(input){
 const file=input.files&&input.files[0];if(!file)return;
 try{
  if(file.size>40*1024*1024)throw Error('File exceeds 27 MB');
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
  const on=currentId===w[0],saved=have.has(w[0]);
  return '<article class="chvoice-item"><div><strong>'+escapeHTML(w[1])+'</strong><div class="small muted">'+escapeHTML(w[2])+' · '+(saved?'Saved on this phone':'No recording yet')+'</div></div><div class="chvoice-actions">'+
    (on?'<button class="primary" onclick="CHVoice.finish()">■ Stop & Save</button>':'<button class="secondary" onclick="CHVoice.start(\''+w[0]+'\')" '+(currentId?'disabled':'')+'>● Record</button>')+
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
 '<p id="voiceStudioStatus" class="chvoice-status" role="status">Opening your voice library…</p><div id="voiceStudioList" class="chvoice-list"></div>'+
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
 if(rec&&rec.state==='recording'){try{rec.stop()}catch(e){}}
 clearMic();stopAudio();
});

global.CHVoice={open,render,start,finish,replay,erase,exportAll,importAll,playWord,stored,save,storedAll,stopAudio,phrase};
global.voiceStudio=open;
global.playVocab=playWord;
})(window);
