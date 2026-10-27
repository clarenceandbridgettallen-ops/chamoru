'use strict';
// Behavior tests for CHamorU private voice library, without microphone or network access.
// Simulated IndexedDB, audio playback and MediaRecorder. No claim of real-device audibility.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../voice-studio.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new vm.Script(source);
test('app integrates recording studio and routes vocabulary through family voices',()=>{
  assert.match(html,/<script src="\.\/voice-studio\.js"><\/script>/);
  assert.match(html,/function vocabularyCard\(v,n\)[\s\S]{0,1500}playVocab/);
  assert.match(html,/function guidedPractice\(\)[\s\S]{0,1400}Family Voice Studio/);
  assert.match(html,/onclick="voiceStudio\(\)"/);
  assert.match(html,/CHVoice\.playLine\(/);
  assert.match(html,/function readerSpeakLine\(p,i\)[\s\S]{0,190}CHVoice\.playLine/);
  assert.match(source,/chamoru-family-voice-v1/);
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
function harness(settings={}){
  const records=new Map(settings.initialRecords||[]),played=[],status=[],audio=[],timeouts=[],nodes=new Map(),deviceStorage=new Map();
  const elem=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',id});return nodes.get(id)};
  const db={
    objectStoreNames:{contains:()=>true},
    createObjectStore(){},
    transaction(){
      // Stage writes until transaction completion, as real IndexedDB does.
      // An aborted multi-clip import must preserve every original recording.
      const pending=[],deletions=[],tx={};let settled=false;
      const complete=()=>{
        const settle=()=>queueMicrotask(()=>{
          if(settled)return;
          settled=true;
          for(const id of deletions)records.delete(id);
          for(const value of pending)records.set(value.id,value);
          tx.oncomplete?.();
        });
        if(settings.deferWriteCompletion&&pending.length&&!settings.releaseWriteCommit){
          settings.releaseWriteCommit=settle;
        }else settle();
      };
      tx.abort=()=>{if(settled)return;settled=true;queueMicrotask(()=>tx.onabort?.())};
      tx.objectStore=()=>({
        get(id){const q={};if(settings.abortRead){queueMicrotask(()=>tx.abort());return q}queueMicrotask(()=>{q.result=records.get(id);q.onsuccess?.()});return q},
        getAll(){const q={},snapshot=[...records.values()];if(settings.abortRead){queueMicrotask(()=>tx.abort());return q}if(settings.deferFirstGetAll&&!settings._deferredGetAll){settings._deferredGetAll=()=>{q.result=snapshot;q.onsuccess?.()}}else queueMicrotask(()=>{q.result=snapshot;q.onsuccess?.()});return q},
        put(value){if(value.id===settings.failPutOnId)throw Error('Synthetic storage quota failure');pending.push(value);complete()},
        delete(id){if(settings.abortDelete){queueMicrotask(()=>tx.abort());return}deletions.push(id);complete()}
      });
      return tx;
    }
  };
  const indexedDB={open(){const q={result:db};queueMicrotask(()=>q.onsuccess?.());return q}};
  class Audio{constructor(url){this.url=url;this.volume=1;this.playbackRate=1;audio.push(this)}
    play(){played.push(this);this.onplaying?.();return Promise.resolve()}
    pause(){this.paused=true}
    removeAttribute(){}load(){}
  }
  class Recorder{
    static isTypeSupported(){return true}
    constructor(stream,opts){this.stream=stream;this.mimeType=opts?.mimeType||'audio/webm';this.state='inactive'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['a'.repeat(128)],{type:'audio/webm'})});this.onstop?.()}
  }
  let tracksStopped=0;
  const getUserMedia=settings.getUserMedia|| (async()=>({getTracks:()=>[{stop:()=>tracksStopped++}]}));
  const c={console,Blob,Uint8Array,Promise,setTimeout,clearTimeout,
    indexedDB,MediaRecorder:Recorder,Audio,
    localStorage:{getItem:k=>deviceStorage.get(k)||null,setItem:(k,v)=>deviceStorage.set(k,v)},
    navigator:{mediaDevices:settings.noMic?null:{getUserMedia}},
    URL:{createObjectURL:blob=>{settings.createdBlobs?.push(blob);return 'blob:testing-'+audio.length},revokeObjectURL(){}},
    document:{getElementById:elem,body:{appendChild(){}},createElement:()=>({click(){},remove(){}})},
    APP:{innerHTML:''},guideNav:()=>'<nav></nav>',stop:()=>{},screen:'home',
    guidedPractice:()=>{},continueLearning:()=>{},play:(word,slow)=>status.push(['tts',word,slow]),
    playStoredGreeting:slow=>status.push(['greeting',slow]),
    lessonAudioStatus:msg=>status.push(['status',msg]),
    confirm:()=>true
  };
  c.window=c;c.global=c;vm.createContext(c);vm.runInContext(source,c);
  const tick=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
  return {c,records,played,status,nodes,tick,deviceStorage,tracksStopped:()=>tracksStopped};
}
test('studio opens with lesson and conversation phrases, visible Next and no network actions',async()=>{
  const h=harness();h.c.voiceStudio();await h.tick();
  assert.match(h.c.APP.innerHTML,/Record our language/);
  assert.match(h.c.APP.innerHTML,/NEXT: Continue learning/);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Nåna/);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Håfa adai!/);
  assert.match(h.c.APP.innerHTML,/Conversations \(6\)/);
  h.c.CHVoice.filter('dialogue');await h.tick();
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Kao siña un ayuda yo/);
});
test('no family recording never triggers known-silent browser TTS',async()=>{
  const h=harness();await h.tick();h.c.playVocab('Håfa adai!','Håfa adai!',false);
  assert.equal(h.played.length,0);
  assert.equal(h.status.some(x=>x[0]==='tts'||x[0]==='greeting'),false);
  assert.match(h.nodes.get('audioStatus').textContent,/No family recording/);
});
test('cached voice begins playing on same tap, before any IndexedDB await',async()=>{
  const h=harness();await h.tick();
  await h.c.CHVoice.save('hafa',new Blob(['x'.repeat(128)],{type:'audio/webm'}));
  h.c.playVocab('Håfa adai!','Håfa adai!',false);
  assert.equal(h.played.length,1,'The audio play request must happen synchronously');
});
test('conversation and reader replay use cached recordings, not device TTS',async()=>{
  const h=harness();await h.tick();
  await h.c.CHVoice.save('howareyou',new Blob(['x'.repeat(128)],{type:'audio/webm'}));
  await h.c.CHVoice.save('canhelp',new Blob(['y'.repeat(128)],{type:'audio/webm'}));
  assert.equal(h.c.CHVoice.playLine('Håfa tatatmanu hao?'),true);
  assert.equal(h.c.CHVoice.playLine('Kao siña un ayuda yo’? ',false,'reader-audio'),true);
  assert.equal(h.played.length,2);
  assert.equal(h.status.some(x=>x[0]==='tts'),false);
  assert.match(h.nodes.get('reader-audio').textContent,/Starting saved family voice/);
});
test('unrecorded conversation gives a readable explanation instead of silent synth',async()=>{
  const h=harness();await h.tick();
  assert.equal(h.c.CHVoice.playLine('Unknown phrase'),false);
  assert.match(h.nodes.get('audioStatus').textContent,/No saved voice entry/);
});
test('saved voice wins over the silent browser text-to-speech engine',async()=>{
  const h=harness();await h.tick();await h.c.CHVoice.save('yes',new Blob(['z'.repeat(128)],{type:'audio/webm'}));
  h.c.playVocab('Hunggan.','Hunggan.',false);await h.tick();
  assert.equal(h.played.length,1);
  assert.equal(h.played[0].playbackRate,1);
  assert.equal(h.status.some(x=>x[0]==='tts'),false);
});
test('microphone recording saves a private clip and releases tracks',async()=>{
  const h=harness();h.c.voiceStudio();await h.tick();
  await h.c.CHVoice.start('mother');h.c.CHVoice.finish();await h.tick();
  assert.ok(h.records.has('mother'));
  assert.equal(h.tracksStopped(),1);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Saved on this phone/);
});
test('invalid or oversized recordings never become saved',async()=>{
  const h=harness();
  await assert.rejects(h.c.CHVoice.save('unlisted',new Blob(['x'])));
  await assert.rejects(h.c.CHVoice.save('yes',new Blob(['x'.repeat(3*1024*1024+1)])));
  assert.equal(h.records.size,0);
});
test('recorded words are never claimed as verified native pronunciation',()=>{
  assert.match(source,/not independently certified/i);
  assert.match(source,/never uploaded automatically/i);
});

// A cancelled permission prompt may resolve after another request for the same word.
// The stale microphone stream must be closed, never used to start a recorder.
test('pending microphone can cancel and stale same-word permission cannot start recording',async()=>{
  const pending=[];let stopped=0;
  const h=harness({getUserMedia:()=>new Promise(resolve=>pending.push(resolve))});
  const stream=()=>({getTracks:()=>[{stop:()=>stopped++}]});
  h.c.voiceStudio();await h.tick();
  const first=h.c.CHVoice.start('mother');await h.tick();
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Cancel microphone request/);
  h.c.CHVoice.cancel();pending[0](stream());await first;await h.tick();
  assert.equal(stopped,1);
  assert.doesNotMatch(h.nodes.get('voiceStudioList').innerHTML,/Stop & Save/);
  const old=h.c.CHVoice.start('mother');await h.tick();h.c.CHVoice.cancel();
  const fresh=h.c.CHVoice.start('mother');await h.tick();
  pending[1](stream());await old;await h.tick();
  assert.equal(stopped,2);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Cancel microphone request/);
  pending[2](stream());await fresh;await h.tick();
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Stop & Save/);
  h.c.CHVoice.finish();await h.tick();
  assert.equal(stopped,3);
  assert.ok(h.records.has('mother'));
});

test('audibility confirmation is saved only locally, not counted as pronunciation mastery',async()=>{
 const h=harness();await h.tick();h.c.voiceStudio();await h.tick();
 await h.c.CHVoice.save('hafa',new Blob(['a'.repeat(128)],{type:'audio/webm'}));
 h.c.CHVoice.replay('hafa');await h.tick();
 h.c.CHVoice.confirmSound(true);await h.tick();
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/not CHamoru pronunciation/);
 const record=JSON.parse(h.deviceStorage.get('chamoru-device-audio-check-v1'));
 assert.equal(record.hafa.heard,true);
 assert.match(h.nodes.get('voiceStudioList').innerHTML,/Your playback check: Heard/);
 assert.equal(h.c.APP.innerHTML.includes('pronunciation mastered'),false);
});
test('recording groups keep 8 starter cards and 6 conversation prompts apart',async()=>{
 const h=harness();await h.tick();h.c.voiceStudio();await h.tick();
 assert.doesNotMatch(h.nodes.get('voiceStudioList').innerHTML,/Mamaolek ha/);
 h.c.CHVoice.filter('dialogue');await h.tick();
 assert.match(h.nodes.get('voiceStudioList').innerHTML,/Mamaolek ha/);
 assert.doesNotMatch(h.nodes.get('voiceStudioList').innerHTML,/Nåna/);
 h.c.CHVoice.filter('starter');await h.tick();
 assert.match(h.nodes.get('voiceStudioList').innerHTML,/Nåna/);
});

test('re-recording or deleting a clip clears only its stale playback confirmation',async()=>{
 const h=harness();h.c.voiceStudio();await h.tick();
 const blob=letter=>new Blob([letter.repeat(128)],{type:'audio/webm'});
 await h.c.CHVoice.save('hafa',blob('a'));
 await h.c.CHVoice.save('yes',blob('y'));
 h.c.CHVoice.replay('hafa');h.c.CHVoice.confirmSound(true);await h.tick();
 h.c.CHVoice.replay('yes');h.c.CHVoice.confirmSound(true);await h.tick();
 assert.equal(JSON.parse(h.deviceStorage.get('chamoru-device-audio-check-v1')).hafa.heard,true);
 await h.c.CHVoice.save('hafa',blob('b'));await h.tick();
 let checks=JSON.parse(h.deviceStorage.get('chamoru-device-audio-check-v1'));
 assert.equal(checks.hafa,undefined,'Replacement clip must not inherit old heard result');
 assert.equal(checks.yes.heard,true,'Other clip checks are preserved');
 assert.doesNotMatch(h.nodes.get('voiceStudioList').innerHTML,/Håfa adai![\\s\\S]{0,160}Your playback check: Heard/);
 h.c.CHVoice.replay('hafa');h.c.CHVoice.confirmSound(true);await h.tick();
 await h.c.CHVoice.erase('hafa');await h.tick();
 checks=JSON.parse(h.deviceStorage.get('chamoru-device-audio-check-v1'));
 assert.equal(checks.hafa,undefined,'Deleted clip must not retain heard result');
 assert.equal(checks.yes.heard,true);
});


test('voice packs with MediaRecorder codec MIME types import without silently losing clips',async()=>{
  // Simulated cross-device transfer. Real Android export/import and playback
  // still require testing on two phones with consenting family speakers.
  const h=harness();h.c.atob=s=>Buffer.from(s,'base64').toString('binary');
  h.c.voiceStudio();await h.tick();
  const payload=Buffer.from('a'.repeat(128)).toString('base64');
  const pack=JSON.stringify({format:'CHamorU-voicepack-v1',clips:[
    {id:'hafa',data:'data:audio/webm;codecs=opus;base64,'+payload},
    {id:'yes',data:'data:audio/mp4;codecs=mp4a.40.2;base64,'+payload},
    {id:'mother',data:'data:audio/webm;base64,'+payload},
    {id:'no',data:'data:text/html;base64,'+payload},
    {id:'father',data:'data:audio/webm;evil=unsafe;base64,'+payload}
  ]});
  const input={files:[{size:pack.length,text:async()=>pack}],value:'selected'};
  await h.c.CHVoice.importAll(input);await h.tick();
  assert.equal(h.records.size,3,'Codec-parameter and legacy clips import; unsafe MIME entries do not');
  assert.equal(h.records.get('hafa').blob.type,'audio/webm;codecs=opus');
  assert.equal(h.records.get('yes').blob.type,'audio/mp4;codecs=mp4a.40.2');
  assert.equal(h.records.get('mother').blob.type,'audio/webm');
  assert.match(h.nodes.get('voiceStudioStatus').textContent,/Imported 3 audio recording/);
  assert.equal(input.value,'');
  h.c.CHVoice.replay('hafa');await h.tick();
  assert.equal(h.played.length,1,'Imported cached voice starts simulated playback');
});


test('duplicate phrase IDs reject a voice pack before replacing any saved family audio',async()=>{
 const h=harness();h.c.voiceStudio();await h.tick();
 const original=new Blob(['original'.repeat(30)],{type:'audio/webm'});
 await h.c.CHVoice.save('hafa',original);
 const payload=Buffer.from('replacement'.repeat(20)).toString('base64');
 const pack=JSON.stringify({format:'CHamorU-voicepack-v1',clips:[
  {id:'hafa',data:'data:audio/webm;base64,'+payload},
  {id:'yes',data:'data:audio/webm;base64,'+payload},
  {id:'hafa',data:'data:audio/webm;base64,'+payload}
 ]});
 const input={files:[{size:pack.length,text:async()=>pack}],value:'selected'};
 await h.c.CHVoice.importAll(input);await h.tick();
 assert.equal(h.records.size,1,'Duplicate pack must not partially import other entries');
 assert.equal(h.records.get('hafa').blob,original,'Existing family recording must remain intact');
 assert.equal(h.records.has('yes'),false);
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Voice pack repeats a phrase/);
 assert.equal(input.value,'');
});

test('corrupt voice-pack clip is skipped without blocking later valid recordings',async()=>{
 const h=harness();h.c.voiceStudio();await h.tick();
 const payload=Buffer.from('v'.repeat(128)).toString('base64');
 h.c.atob=s=>{if(s==='AB')throw Error('Invalid base64');return Buffer.from(s,'base64').toString('binary')};
 const pack=JSON.stringify({format:'CHamorU-voicepack-v1',clips:[
  {id:'hafa',data:'data:audio/webm;base64,AB'},
  {id:'yes',data:'data:audio/webm;codecs=opus;base64,'+payload}
 ]});
 const input={files:[{size:pack.length,text:async()=>pack}],value:'selected'};
 await h.c.CHVoice.importAll(input);await h.tick();
 assert.equal(h.records.size,1);
 assert.equal(h.records.has('hafa'),false);
 assert.equal(h.records.get('yes').blob.type,'audio/webm;codecs=opus');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Imported 1 audio recording/);
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/1 invalid or unsupported clip/);
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Check playback on this device/);
 assert.equal(input.value,'');
});

// IndexedDB warmup may finish after a newer save or deletion. A stale snapshot
// must never resurrect deleted family audio or replace a fresh recording.
test('late voice-cache warmup preserves replacement and deletion',async()=>{
 for(const action of ['replace','erase']){
  const oldBlob=new Blob(['old'.repeat(60)],{type:'audio/webm'});
  const freshBlob=new Blob(['new'.repeat(60)],{type:'audio/webm'});
  const createdBlobs=[];
  const settings={initialRecords:[['hafa',{id:'hafa',blob:oldBlob}]],deferFirstGetAll:true,createdBlobs};
  const h=harness(settings);await h.tick();
  assert.equal(typeof settings._deferredGetAll,'function','Warmup read must be held');
  if(action==='replace')await h.c.CHVoice.save('hafa',freshBlob);
  else await h.c.CHVoice.erase('hafa');
  settings._deferredGetAll();await h.tick();
  const started=h.c.CHVoice.playWord('Håfa adai!',null,false);
  if(action==='replace'){
   assert.equal(started,true);
   assert.equal(createdBlobs.at(-1),freshBlob,'New recording must win over stale warmup');
  }else{
   assert.equal(started,false,'Deleted recording must not be revived');
   assert.equal(createdBlobs.length,0);
  }
 }
});

test('failed multi-clip import does not partially overwrite existing family recordings',async()=>{
 const h=harness({failPutOnId:'yes'});h.c.atob=s=>Buffer.from(s,'base64').toString('binary');
 h.c.voiceStudio();await h.tick();
 const original=new Blob(['original'.repeat(30)],{type:'audio/webm'});
 await h.c.CHVoice.save('hafa',original);
 const payload=Buffer.from('replacement'.repeat(20)).toString('base64');
 const pack=JSON.stringify({format:'CHamorU-voicepack-v1',clips:[
  {id:'hafa',data:'data:audio/webm;base64,'+payload},
  {id:'yes',data:'data:audio/webm;base64,'+payload}
 ]});
 const input={files:[{size:pack.length,text:async()=>pack}],value:'selected'};
 await h.c.CHVoice.importAll(input);await h.tick();
 assert.equal(h.records.size,1,'No partial import after a storage error');
 assert.equal(h.records.get('hafa').blob,original,'Original recording must survive failed import');
 assert.equal(h.records.has('yes'),false);
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Import error: Synthetic storage quota failure/);
 assert.equal(input.value,'');
});


test('voice pack import and export wait until microphone recording or permission request ends',async()=>{
 const pending=[];const h=harness({getUserMedia:()=>new Promise(resolve=>pending.push(resolve))});
 h.c.voiceStudio();await h.tick();
 const permission=h.c.CHVoice.start('hafa');await h.tick();
 await h.c.CHVoice.exportAll();
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Finish recording or cancel the microphone request before exporting/);
 let fileRead=false;
 const input={files:[{size:12,text:async()=>{fileRead=true;return '{}'}}],value:'selected'};
 await h.c.CHVoice.importAll(input);
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Finish recording or cancel the microphone request before importing/);
 assert.equal(fileRead,false,'Private import must not begin during microphone capture');
 assert.equal(input.value,'','Blocked file selection must be cleared');
 assert.equal(h.records.size,0);
 h.c.CHVoice.cancel();pending[0]({getTracks:()=>[{stop(){}}]});await permission;await h.tick();
});

test('Stop & Save holds the voice transfer and new-recording gates until storage commits',async()=>{
 const settings={deferWriteCompletion:true};
 const h=harness(settings);h.c.voiceStudio();await h.tick();
 await h.c.CHVoice.start('hafa');await h.tick();
 h.c.CHVoice.finish();await h.tick();
 assert.equal(typeof settings.releaseWriteCommit,'function','Synthetic save must still be pending');
 assert.match(h.nodes.get('voiceStudioList').innerHTML,/Saving on this phone/);
 assert.match(h.nodes.get('voiceStudioList').innerHTML,/disabled/);
 await h.c.CHVoice.exportAll();
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Saving your recording.*before exporting/);
 let read=false;
 const input={files:[{size:2,text:async()=>{read=true;return '{}'}}],value:'selected'};
 await h.c.CHVoice.importAll(input);
 assert.equal(read,false,'Import must not read family files before the prior save commits');
 assert.equal(input.value,'');
 await h.c.CHVoice.start('yes');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/finish saving before starting another/);
 assert.equal(h.records.has('hafa'),false,'Storage commit is deliberately still pending');
 settings.releaseWriteCommit();await h.tick();
 assert.equal(h.records.has('hafa'),true,'Saved recording should be present after commit');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Saved Håfa adai/);
 assert.doesNotMatch(h.nodes.get('voiceStudioList').innerHTML,/Saving on this phone/);
});

// A voice-pack read/encode is asynchronous. The capture and transfer guards
// must remain held for the ENTIRE operation, not merely its first synchronous tick.
test('in-flight voice-pack import serializes recording and other transfers',async()=>{
 const h=harness();h.c.atob=s=>Buffer.from(s,'base64').toString('binary');
 h.c.voiceStudio();await h.tick();
 let releaseRead;
 const payload=Buffer.from('q'.repeat(128)).toString('base64');
 const pack=JSON.stringify({format:'CHamorU-voicepack-v1',clips:[{id:'hafa',data:'data:audio/webm;base64,'+payload}]});
 const input={files:[{size:pack.length,text:()=>new Promise(resolve=>{releaseRead=resolve})}],value:'selected'};
 const job=h.c.CHVoice.importAll(input);await h.tick();
 assert.equal(typeof releaseRead,'function','Import must be waiting for file data');
 await h.c.CHVoice.start('mother');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/voice-pack transfer finishes before recording/);
 await h.c.CHVoice.exportAll();
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/current voice-pack transfer finishes/);
 assert.equal(h.records.size,0,'Import has not committed while file read is pending');
 releaseRead(pack);await job;await h.tick();
 assert.equal(h.records.has('hafa'),true);
 assert.equal(input.value,'');
 await h.c.CHVoice.start('mother');h.c.CHVoice.finish();await h.tick();
 assert.equal(h.records.has('mother'),true,'Recording allowed after import completes');
});

test('in-flight voice-pack export blocks capture and deletion until encoding finishes',async()=>{
 const h=harness();h.c.voiceStudio();await h.tick();
 await h.c.CHVoice.save('hafa',new Blob(['z'.repeat(128)],{type:'audio/webm'}));
 let finishEncoding;
 h.c.FileReader=class {
   readAsDataURL(){finishEncoding=()=>{this.result='data:audio/webm;base64,'+Buffer.from('z'.repeat(128)).toString('base64');this.onload?.()}}
 };
 const exportJob=h.c.CHVoice.exportAll();await h.tick();
 assert.equal(typeof finishEncoding,'function','Export must be waiting for encoding');
 await h.c.CHVoice.start('mother');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/voice-pack transfer finishes before recording/);
 await h.c.CHVoice.erase('hafa');
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/voice-pack transfer finishes before deleting/);
 assert.equal(h.records.has('hafa'),true);
 finishEncoding();await exportJob;await h.tick();
 assert.match(h.nodes.get('voiceStudioStatus').textContent,/Voice pack download started/);
 await h.c.CHVoice.start('mother');h.c.CHVoice.finish();await h.tick();
 assert.equal(h.records.has('mother'),true,'Capture allowed after export completes');
});

test('aborted IndexedDB delete reports failure without losing the family recording',async()=>{
  const h=harness({abortDelete:true});h.c.voiceStudio();await h.tick();
  await h.c.CHVoice.save('hafa',new Blob(['v'.repeat(128)],{type:'audio/webm'}));
  const outcome=await Promise.race([
    h.c.CHVoice.erase('hafa').then(()=> 'finished'),
    new Promise(resolve=>setTimeout(()=>resolve('hung'),100))
  ]);
  assert.equal(outcome,'finished','Aborted deletion must not leave the UI awaiting forever');
  assert.equal(h.records.has('hafa'),true,'Aborted transaction must preserve saved family audio');
  assert.match(h.nodes.get('voiceStudioStatus').textContent,/Delete failed: Delete interrupted/);
});


test('aborted IndexedDB reads settle and report export failure without changing clips',async()=>{
  const h=harness({abortRead:true});await h.tick();
  for(const read of [()=>h.c.CHVoice.stored('hafa'),()=>h.c.CHVoice.storedAll()]){
    const outcome=await Promise.race([read().then(()=> 'unexpected success',e=>e.message),new Promise(resolve=>setTimeout(()=>resolve('hung'),100))]);
    assert.equal(outcome,'Read interrupted','Aborted local read must not hang');
  }
  await h.c.CHVoice.exportAll();
  assert.match(h.nodes.get('voiceStudioStatus').textContent,/Export error: Read interrupted/);
  assert.equal(h.records.size,0,'No family recording may be changed by a failed read');
});
