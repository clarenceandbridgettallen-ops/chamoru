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
  const records=new Map(),played=[],status=[],audio=[],timeouts=[],nodes=new Map(),deviceStorage=new Map();
  const elem=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',id});return nodes.get(id)};
  const db={
    objectStoreNames:{contains:()=>true},
    createObjectStore(){},
    transaction(){
      const tx={};
      tx.objectStore=()=>({
        get(id){const q={};queueMicrotask(()=>{q.result=records.get(id);q.onsuccess?.()});return q},
        getAll(){const q={};queueMicrotask(()=>{q.result=[...records.values()];q.onsuccess?.()});return q},
        put(value){records.set(value.id,value);queueMicrotask(()=>tx.oncomplete?.())},
        delete(id){records.delete(id);queueMicrotask(()=>tx.oncomplete?.())}
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
    URL:{createObjectURL:()=> 'blob:testing-'+audio.length,revokeObjectURL(){}},
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
