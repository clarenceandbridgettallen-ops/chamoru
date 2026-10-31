'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {makePreview, assertDraft} = require('./draft_recall_preview.js');
const draft = JSON.parse(fs.readFileSync(path.join(__dirname, '../curriculum/drafts/greetings_recall_v1.json'), 'utf8'));

test('requires explicit unapproved written-only review status', () => {
  assert.doesNotThrow(() => assertDraft(draft));
  assert.throws(() => makePreview({...draft, publish_approved:true}), /unapproved/);
  assert.throws(() => makePreview({...draft, pronunciation_status:'APPROVED'}), /unapproved/);
});
test('48 prompts across all three modes, no progress writes', () => {
  const p = makePreview(draft, 20261031);
  assert.equal(p.questions.length, 48);
  assert.equal(p.graded, false);
  assert.equal(p.progress_written, false);
  assert.deepEqual([...new Set(p.questions.map(q => q.mode))].sort(),
    ['meaning_recognition','typed_chamoru_recall','typed_english_meaning'].sort());
});
test('recognition always contains exactly one correct meaning', () => {
  const p = makePreview(draft, 5);
  for (const q of p.questions.filter(q => q.mode === 'meaning_recognition')) {
    const answer = draft.phrases.find(x => x.chamoru === q.prompt).english;
    assert.equal(q.options.filter(x => x === answer).length, 1);
    assert.equal(new Set(q.options).size, q.options.length);
    assert.equal(q.options.length, 4);
  }
});
test('seed repeatable, different seed changes ordering', () => {
  assert.deepEqual(makePreview(draft, 42), makePreview(draft, 42));
  assert.notDeepEqual(makePreview(draft, 42).questions, makePreview(draft, 43).questions);
});
test('no audio, answer keys, scores or student identifiers in question objects', () => {
  const p = makePreview(draft, 3);
  assert.ok(p.questions.every(q => !['answer','correct','audio','score','student'].some(k => k in q)));
});
test('refuses duplicate phrase and ambiguous meanings', () => {
  const copy = JSON.parse(JSON.stringify(draft));
  copy.phrases[1].chamoru = copy.phrases[0].chamoru;
  assert.throws(() => makePreview(copy), /Duplicate/);
  const copy2 = JSON.parse(JSON.stringify(draft));
  copy2.phrases[1].english = copy2.phrases[0].english;
  assert.throws(() => makePreview(copy2), /Ambiguous/);
});
test('invalid seed fails closed', () => {
  assert.throws(() => makePreview(draft, -1), /seed/);
  assert.throws(() => makePreview(draft, 1.5), /seed/);
});
