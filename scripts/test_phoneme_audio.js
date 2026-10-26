'use strict';
// Behavioral regression tests for the actual guided-phoneme player in index.html.
// Fake Audio events test state transitions; they do not prove audible phone sound.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function u0PlayRecordedPhoneme(phoneme)');
const end=html.indexOf('async function u0SaySequence(',start);
assert.ok(start>=0&&end>start,'guided phoneme player must be present');
const playerSource=html.slice(start,end);

function setup(behavior='pending'){
  const statuses=[];const timers=[];const clips=[];
  class FakeAudio{
    constructor(url){if(behavior==='constructor')throw new Error('Audio unavailable');this.url=url;this.paused=false;clips.push(this)}
    play(){
      if(behavior==='throw')throw new Error('Audio blocked');
      if(behavior==='reject')return Promise.reject(new Error('Audio blocked'));
      if(behavior==='deferred-reject')return new Promise((_,reject)=>{this.rejectPlay=reject});
      return new Promise(()=>{});
    }
    pause(){this.paused=true}
  }
  const ctx={Audio:FakeAudio,U0_PHONEME_AUDIO:{ts:'test:phoneme'},
    u0SetStatus:msg=>statuses.push(msg),
    setTimeout:(fn,ms)=>{const t={fn,ms,cleared:false};timers.push(t);return t},
    clearTimeout:t=>{t.cleared=true}};
  vm.createContext(ctx);
  vm.runInContext('let u0ActiveClip=null;\n'+playerSource,ctx);
  return {ctx,statuses,timers,clips,play:s=>vm.runInContext('u0PlayRecordedPhoneme('+JSON.stringify(s)+')',ctx),active:()=>vm.runInContext('u0ActiveClip',ctx)};
}

test('completed recorded phoneme releases audio and timer',async()=>{
  const h=setup();const p=h.play('ts');
  assert.equal(h.timers[0].ms,7000);
  h.clips[0].onended();assert.equal(await p,true);
  assert.equal(h.active(),null);assert.equal(h.timers[0].cleared,true);
});

test('stalled recorded phoneme pauses clip and reports recovery',async()=>{
  const h=setup();const p=h.play('ts');h.timers[0].fn();
  assert.equal(await p,false);assert.equal(h.clips[0].paused,true);
  assert.match(h.statuses.join(' '),/Sound stalled/);
  assert.equal(h.active(),null);
});

test('rejected Audio.play reports blocked playback without hanging',async()=>{
  const h=setup('reject');assert.equal(await h.play('ts'),false);
  assert.match(h.statuses.join(' '),/Audio is blocked/);
  assert.equal(h.active(),null);
});

test('audio error and synchronous play failure resolve false',async()=>{
  const a=setup();const p=a.play('ts');a.clips[0].onerror();
  assert.equal(await p,false);assert.match(a.statuses.join(' '),/could not load/);
  const b=setup('throw');assert.equal(await b.play('ts'),false);
  assert.match(b.statuses.join(' '),/could not start/);
});

test('unknown phoneme resolves without creating audio',async()=>{
  const h=setup();assert.equal(await h.play('unknown'),false);
  assert.equal(h.clips.length,0);
});


test('late error after timeout cannot overwrite stalled-audio guidance',async()=>{
  const h=setup();const p=h.play('ts');h.timers[0].fn();
  assert.equal(await p,false);
  const before=h.statuses.join(' ');
  h.clips[0].onerror();
  assert.equal(h.statuses.join(' '),before);
  assert.equal(h.active(),null);
});

test('unavailable Audio constructor offers browser recovery',async()=>{
  const h=setup('constructor');
  assert.equal(await h.play('ts'),false);
  assert.match(h.statuses.join(' '),/Audio player unavailable/);
  assert.equal(h.active(),null);
});


test('superseded clip timeout cannot interrupt newer playback',async()=>{
  const h=setup();const older=h.play('ts');const newer=h.play('ts');
  h.timers[0].fn();
  assert.equal(await older,false);
  assert.equal(h.active(),h.clips[1]);
  assert.equal(h.statuses.length,0,'Old timeout must not display stale warnings');
  assert.equal(h.clips[0].paused,true,'Superseded audio must be paused immediately');
  h.clips[1].onended();
  assert.equal(await newer,true);
  assert.equal(h.active(),null);
  assert.ok(h.timers.every(t=>t.cleared));
});


test('late completion from superseded clip cannot count as success',async()=>{
  const h=setup();const older=h.play('ts');const newer=h.play('ts');
  h.clips[0].onended();
  assert.equal(await older,false,'Old clip must not report success after replacement');
  assert.equal(h.active(),h.clips[1],'Newer clip must stay active');
  h.clips[1].onended();
  assert.equal(await newer,true);
  assert.ok(h.timers.every(t=>t.cleared));
});

test('late playback rejection cannot replace status or interrupt a newer clip',async()=>{
  const h=setup('deferred-reject');
  const older=h.play('ts');const newer=h.play('ts');
  h.clips[0].rejectPlay(new Error('late blocked'));
  assert.equal(await older,false);
  assert.equal(h.statuses.length,0,'Superseded rejection must not overwrite status');
  assert.equal(h.active(),h.clips[1],'Newer audio remains active');
  h.clips[1].onended();
  assert.equal(await newer,true);
  assert.ok(h.timers.every(t=>t.cleared));
});


test('new phoneme immediately cancels and settles the previous clip',async()=>{
  const h=setup();const old=h.play('ts');const newer=h.play('ts');
  assert.equal(await old,false,'Previous playback should settle immediately');
  assert.equal(h.clips[0].paused,true);
  assert.equal(h.timers[0].cleared,true);
  assert.equal(h.active(),h.clips[1]);
  h.clips[1].onended();assert.equal(await newer,true);
  assert.ok(h.timers.every(t=>t.cleared));
});
