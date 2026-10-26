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

const sequenceStart=html.indexOf('async function u0SaySequence(');
const sequenceEnd=html.indexOf('function u0PlaySymbol(',sequenceStart);
assert.ok(sequenceStart>=0&&sequenceEnd>sequenceStart,'guided audio sequence must exist');
const sequenceSource=html.slice(sequenceStart,sequenceEnd);
function sequenceHarness(clipWorks){
  const statuses=[];
  const ctx={
    U0_PHONEME_AUDIO:{ts:'test:phoneme'},
    u0PlaybackNumber:0,
    u0StopSound:()=>{ctx.u0PlaybackNumber++},
    u0SetStatus:msg=>statuses.push(msg),
    u0PlayRecordedPhoneme:async()=>{if(!clipWorks)statuses.push('Sound stalled. Try Test Sound.');return clipWorks},
    u0Breath:async()=>{},u0AmericanUtter:async()=>{},
    window:{},setTimeout:fn=>{fn();return 1}
  };
  vm.createContext(ctx);vm.runInContext(sequenceSource,ctx);
  return {statuses,run:()=>vm.runInContext("u0SaySequence(['ts'],'CH sound')",ctx)};
}

test('failed recorded phoneme does not falsely announce finished sequence',async()=>{
  const h=sequenceHarness(false);await h.run();
  assert.match(h.statuses.at(-1),/Sound stalled/);
  assert.equal(h.statuses.some(x=>x.startsWith('Finished.')),false);
});

test('successful recorded phoneme may announce finished sequence',async()=>{
  const h=sequenceHarness(true);await h.run();
  assert.match(h.statuses.at(-1),/^Finished\./);
});

const speakerStart=html.indexOf('function u0SoundTest(){');
const speakerEnd=html.indexOf('window.u0SoundTest=u0SoundTest;',speakerStart);
assert.ok(speakerStart>=0&&speakerEnd>speakerStart,'speaker test must exist');
const speakerSource=html.slice(speakerStart,speakerEnd);
function speakerHarness(state='running'){
  const statuses=[],oscillators=[],resumes=[];
  class FakeContext{
    constructor(){this.state=state;this.currentTime=0;this.destination={}}
    createOscillator(){
      const osc={frequency:{setValueAtTime(){}},connect(){},start(){this.started=true},
        stop(){this.stopCalls=(this.stopCalls||0)+1}};
      oscillators.push(osc);return osc;
    }
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
    resume(){return new Promise((resolve,reject)=>resumes.push({resolve,reject}))}
  }
  const ctx={window:{AudioContext:FakeContext},u0SetStatus:msg=>statuses.push(msg)};
  vm.createContext(ctx);
  vm.runInContext('let u0PlaybackNumber=0,u0AudioContext=null,u0ActiveSource=null;'+
    'function u0StopSound(){u0PlaybackNumber++;if(u0ActiveSource){u0ActiveSource.stop();u0ActiveSource=null}}\n'+
    speakerSource,ctx);
  return {statuses,oscillators,resumes,
    play:()=>vm.runInContext('u0SoundTest()',ctx),
    stop:()=>vm.runInContext('u0StopSound()',ctx)};
}

test('speaker test ignores superseded oscillator completion',()=>{
  const h=speakerHarness();
  h.play();h.play();
  assert.equal(h.oscillators.length,2);
  assert.ok(h.oscillators[0].stopCalls>=2,'Prior test tone must be stopped');
  const before=h.statuses.length;
  h.oscillators[0].onended();
  assert.equal(h.statuses.length,before,'Stale completion must not replace status');
  h.oscillators[1].onended();
  assert.match(h.statuses.at(-1),/Test tone completed/);
});

test('cancelled speaker test cannot start after delayed audio resume',async()=>{
  const h=speakerHarness('suspended');
  h.play();assert.equal(h.resumes.length,1);
  h.stop();h.resumes[0].resolve();
  await Promise.resolve();await Promise.resolve();
  assert.equal(h.oscillators.length,0,'Cancelled test must not start a late tone');
});

const americanStart=html.indexOf('function u0AmericanUtter(text)');
const americanEnd=html.indexOf('function u0PlayRecordedPhoneme(',americanStart);
assert.ok(americanStart>=0&&americanEnd>americanStart,'English-example voice player must exist');
const americanSource=html.slice(americanStart,americanEnd);
function englishVoiceHarness(behavior='normal'){
  const statuses=[],timers=[],utterances=[];let cancelled=false;
  class FakeUtterance{constructor(text){this.text=text;utterances.push(this)}}
  const ctx={window:{speechSynthesis:{}},SpeechSynthesisUtterance:FakeUtterance,
    u0PlaybackNumber:0,u0USVoice:()=>null,u0SetStatus:msg=>statuses.push(msg),
    setTimeout:(fn,ms)=>{const timer={fn,ms,cleared:false};timers.push(timer);return timer},
    clearTimeout:t=>{t.cleared=true},
    speechSynthesis:{speak(){if(behavior==='throw')throw new Error('blocked')},
      cancel(){cancelled=true}}};
  vm.createContext(ctx);vm.runInContext(americanSource,ctx);
  return {statuses,timers,utterances,play:()=>vm.runInContext("u0AmericanUtter('ah')",ctx),
    cancelled:()=>cancelled};
}
test('English example voice timeout settles and displays browser recovery',async()=>{
  const h=englishVoiceHarness();const pending=h.play();
  assert.equal(h.timers[0].ms,7000);h.timers[0].fn();
  assert.equal(await pending,false);assert.equal(h.cancelled(),true);
  assert.match(h.statuses.at(-1),/English example voice stalled/);
  const prior=h.statuses.length;h.utterances[0].onend();
  assert.equal(h.statuses.length,prior,'Late completion cannot replace failure guidance');
});
test('English example voice completion clears watchdog',async()=>{
  const h=englishVoiceHarness();const pending=h.play();h.utterances[0].onend();
  assert.equal(await pending,true);assert.equal(h.timers[0].cleared,true);
});
test('English example voice error and blocked start resolve false',async()=>{
  const a=englishVoiceHarness();const first=a.play();a.utterances[0].onerror();
  assert.equal(await first,false);assert.match(a.statuses.at(-1),/voice failed/);
  const b=englishVoiceHarness('throw');assert.equal(await b.play(),false);
  assert.match(b.statuses.at(-1),/could not start/);
});
test('guided sequence exits on failed English example rather than reporting finished',()=>{
  assert.match(sequenceSource,/else if\(!await u0AmericanUtter\(item\)\)return/);
});
