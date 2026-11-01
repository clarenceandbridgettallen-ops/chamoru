'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {planSpeechUnits}=require('./speech_unit_plan');
test('CH and NG remain one grapheme, with provisional phoneme only',()=>{
  const x=planSpeechUnits('CH ng');
  assert.deepEqual(x.units.map(u=>u.glyph),['CH',' ','ng']);
  assert.deepEqual(x.units.map(u=>u.candidateIpa),['t͡s',null,'ŋ']);
  assert.equal(x.readyForSynthesis,false);
});
test('apostrophes are not silently removed',()=>{
  const x=planSpeechUnits("Si Yu’us ma’åse’");
  assert.equal(x.units.filter(u=>u.kind==='glottal-candidate').length,3);
  assert.equal(x.fluentReviewRequired,true);
});
test('vowels, stress and dialect remain explicitly unmapped',()=>{
  const x=planSpeechUnits('Håfa ǻ');
  assert.equal(x.units.find(u=>u.glyph==='å').kind,'unmapped-letter');
  assert.equal(x.units.find(u=>u.glyph==='ǻ').kind,'unmapped-letter');
  assert.equal(x.audioGenerated,false);
});
test('invalid letters cannot become sound through fallback',()=>{
  const x=planSpeechUnits('C Z 9');
  assert.equal(x.units.filter(u=>u.kind==='unsupported').length,3);
  assert.equal(x.publishApproved,false);
});
test('input limit and type inherited from written tokenizer',()=>{
  assert.throws(()=>planSpeechUnits(null),TypeError);
  assert.throws(()=>planSpeechUnits('a'.repeat(2049)),TypeError);
});
test('Unicode NFC normalization preserves source graphemes',()=>{
  const x=planSpeechUnits('a\u030a');
  assert.equal(x.sourceText,'å');
  assert.equal(x.units.length,1);
});
test('no live learner, storage, network or audio side effects',()=>{
  const x=planSpeechUnits('Håfa adai');
  assert.equal(x.audioGenerated,false);
  assert.equal(x.readyForSynthesis,false);
  assert.equal(x.publishApproved,false);
  assert.equal(x.units.some(u=>u.candidateIpa===null&&u.kind==='unmapped-letter'),true);
});

