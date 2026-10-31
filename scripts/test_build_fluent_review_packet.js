'use strict';
const assert = require('node:assert/strict');
const {buildReviewPacket} = require('./build_fluent_review_packet');
const draft = {
  schema:'chamoru-curriculum-draft-v1', status:'DRAFT_NOT_LIVE_FLUENT_REVIEW_REQUIRED',
  publish_approved:false, audio_status:'NO_APPROVED_SPOKEN_AUDIO', pronunciation_status:'NOT_REVIEWED',
  id:'test', sources:{greetings:'https://www.visitguam.com/chamorro-culture/simple-chamorro-greetings/'},
  phrases:[{chamoru:'Håfa adai',english:'hello',source:'greetings'},
           {chamoru:'Na\'an hu si',english:'my name is...',source:'greetings'}]
};
let n=0;
function test(name, fn){fn(); n++; console.log('PASS',name);}
test('review-only packet never approves or publishes',()=>{
  const r=buildReviewPacket(draft);
  assert.equal(r.status,'REVIEW_ONLY_NOT_PUBLISHABLE');
  assert.equal(r.entries.length,2);
  assert.equal(r.entries[0].pronunciation_review,'PENDING_FLUENT_REVIEW');
  assert.equal(r.entries[1].flags[0],'INCOMPLETE_TEMPLATE_NEEDS_CONTEXT');
  assert.equal(JSON.stringify(r).includes('approved:true'),false);
});
test('rejects published draft',()=>assert.throws(()=>buildReviewPacket({...draft,publish_approved:true})));
test('rejects claimed approved pronunciation',()=>assert.throws(()=>buildReviewPacket({...draft,pronunciation_status:'APPROVED'})));
test('rejects non-HTTPS source',()=>assert.throws(()=>buildReviewPacket({...draft,sources:{greetings:'http://example.com/audio'}})));
test('rejects missing source',()=>assert.throws(()=>buildReviewPacket({...draft,phrases:[{chamoru:'X',english:'Y',source:'missing'}]})));
test('rejects normalized duplicate phrase',()=>assert.throws(()=>buildReviewPacket({...draft,phrases:[draft.phrases[0],{...draft.phrases[0],chamoru:' Håfa adai '}]})));
test('does not mutate source',()=>{const before=JSON.stringify(draft);buildReviewPacket(draft);assert.equal(JSON.stringify(draft),before);});
console.log(`${n}/${n} tests passed`);
