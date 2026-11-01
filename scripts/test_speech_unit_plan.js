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
test('six written vowel classes have provisional IPA candidates, not approved sounds',()=>{
  const x=planSpeechUnits('a å e i o u');
  assert.deepEqual(x.units.filter(u=>u.kind!=='separator').map(u=>u.candidateIpa),
    ['a','ɒ','e','i','o','u']);
  assert.ok(x.units.filter(u=>u.kind!=='separator').every(u=>u.kind==='provisional-phoneme'&&u.needsReview));
  assert.equal(x.unresolved,6);
  assert.equal(x.readyForSynthesis,false);
  assert.equal(x.audioGenerated,false);
  assert.equal(x.publishApproved,false);
});
test('accented and decomposed vowels remain review-only; no stress or syllable realization inferred',()=>{
  const x=planSpeechUnits('Håfa ǻ á é í ó ú a\u030a');
  assert.equal(x.units.find(u=>u.glyph==='å').candidateIpa,'ɒ');
  assert.equal(x.units.find(u=>u.glyph==='ǻ').candidateIpa,'ɒ');
  assert.deepEqual(x.units.filter(u=>['á','é','í','ó','ú'].includes(u.glyph)).map(u=>u.candidateIpa),
    ['a','e','i','o','u']);
  assert.equal(x.units[x.units.length-1].glyph,'å');
  assert.equal(x.units[x.units.length-1].candidateIpa,'ɒ');
  assert.equal(x.units.some(u=>u.kind==='unmapped-letter'),true);
  assert.equal(x.fluentReviewRequired,true);
  assert.equal(x.readyForSynthesis,false);
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

