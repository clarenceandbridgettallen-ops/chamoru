'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const root = path.join(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/drafts/greetings_recall_v1.json'), 'utf8'));
const draft = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/drafts/greetings_scenarios_v1.json'), 'utf8'));

test('all scenarios remain unpublished and unreviewed', () => {
  assert.equal(draft.publish_approved, false);
  assert.match(draft.status, /NOT_LIVE/);
  assert.equal(draft.audio_status, 'NO_APPROVED_SPOKEN_AUDIO');
  assert.equal(draft.pronunciation_status, 'NOT_REVIEWED');
  assert.equal(draft.cultural_context_status, 'NOT_REVIEWED');
});
test('four distinct contexts each have a unique original independent task', () => {
  assert.equal(draft.scenarios.length, 4);
  assert.equal(new Set(draft.scenarios.map(s => s.id)).size, 4);
  assert.equal(new Set(draft.scenarios.map(s => s.independent_prompt)).size, 4);
  assert.ok(draft.scenarios.every(s => s.english_context && s.phrase_indices.length >= 3));
});
test('all phrase references are valid and incomplete template stays quarantined', () => {
  const seen = new Set();
  for (const scene of draft.scenarios) for (const id of scene.phrase_indices) {
    assert.ok(Number.isInteger(id) && id >= 0 && id < source.phrases.length);
    assert.ok(!draft.quarantined_phrase_indices.includes(id));
    assert.ok(source.phrases[id].chamoru && source.phrases[id].english);
    seen.add(id);
  }
  assert.equal(source.phrases.length, 16);
  assert.equal(seen.size, 15);
  assert.deepEqual([...Array(16).keys()].filter(i => !seen.has(i)), [5]);
});
test('independent recall and navigation are planned without touching saved learner state', () => {
  for (const mode of ['independent_english_meaning','independent_chamoru_recall','dialogue_order_reconstruction'])
    assert.ok(draft.practice_modes.includes(mode));
  for (const key of ['saved_progress','mastery_gates','games','reader','culture_library','back_next'])
    assert.ok(draft.preserve.includes(key));
  assert.match(draft.help_policy, /never a submitted independent-answer key/);
  assert.equal('answer_key' in draft, false);
});
test('no unapproved spoken content or grading release fields', () => {
  const text = JSON.stringify(draft);
  assert.ok(!/"(?:audio_url|media_url|pronunciation_approved|grade_write)"\s*:/.test(text));
});
