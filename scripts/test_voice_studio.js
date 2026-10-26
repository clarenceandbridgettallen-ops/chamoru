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
  assert.match(source,/chamoru-family-voice-v1/);
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
function harness(settings={}){
  const records=new Map(),played=[],status=[],audio=[],timeouts=[],nodes=new Map();
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
    play(){played.push(this);return Promise.resolve()}
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
  const getUserMedia=async()=>({getTracks:()=>[{stop:()=>tracksStopped++}]});
  const c={console,Blob,Uint8Array,Promise,setTimeout,clearTimeout,
    indexedDB,MediaRecorder:Recorder,Audio,
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
  return {c,records,played,status,nodes,tick,tracksStopped:()=>tracksStopped};
}
test('studio opens with eight phrases, visible Next and no network actions',async()=>{
  const h=harness();h.c.voiceStudio();await h.tick();
  assert.match(h.c.APP.innerHTML,/Record our language/);
  assert.match(h.c.APP.innerHTML,/NEXT: Continue learning/);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Nåna/);
  assert.match(h.nodes.get('voiceStudioList').innerHTML,/Håfa adai!/);
});
test('no saved voice uses legacy greeting and does not pretend sound is validated',async()=>{
  const h=harness();await h.c.playVocab('Håfa adai!','Håfa adai!',false);await h.tick();
  assert.deepEqual(h.status.at(-1),['greeting',false]);
  assert.equal(h.played.length,0);
});
test('saved voice wins over the silent browser text-to-speech engine',async()=>{
  const h=harness();await h.c.CHVoice.save('yes',new Blob(['z'.repeat(128)],{type:'audio/webm'}));
  await h.c.playVocab('Hunggan.','Hunggan.',false);await h.tick();
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
