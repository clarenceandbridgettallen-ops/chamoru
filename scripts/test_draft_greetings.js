// Offline draft QA only. Never marks pronunciation or mastery as verified.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lesson = JSON.parse(fs.readFileSync(path.join(__dirname, '../curriculum/drafts/greetings_recall_v1.json'), 'utf8'));
const check = (label, fn) => { fn(); console.log('PASS', label); };
check('schema and review lock', () => {
  assert.equal(lesson.schema, 'chamoru-curriculum-draft-v1');
  assert.equal(lesson.publish_approved, false);
  assert.match(lesson.status, /NOT_LIVE/);
  assert.equal(lesson.pronunciation_status, 'NOT_REVIEWED');
  assert.equal(lesson.audio_status, 'NO_APPROVED_SPOKEN_AUDIO');
});
check('16 unique nonempty phrase pairs', () => {
  assert.equal(lesson.phrases.length, 16);
  assert.equal(new Set(lesson.phrases.map(p => p.chamoru.toLocaleLowerCase())).size, 16);
  lesson.phrases.forEach(p => { assert.ok(p.chamoru.trim()); assert.ok(p.english.trim()); });
});
check('sourced to original publisher URLs', () => {
  assert.ok(lesson.sources.orthography_reference.includes('kumisionchamoru.guam.gov'));
  lesson.phrases.forEach(p => {
    assert.ok(['greetings', 'travel'].includes(p.source));
    assert.ok(lesson.sources[p.source].startsWith('https://www.visitguam.com/'));
  });
});
check('independent written recall alongside recognition', () => {
  assert.deepEqual(lesson.lesson_flow, ['meaning_recognition', 'typed_english_meaning', 'typed_chamoru_recall']);
});
check('no media, progress writes or answer gate changes', () => {
  assert.ok(lesson.preserve.includes('mastery_gates'));
  assert.ok(lesson.preserve.includes('saved_progress'));
  assert.ok(lesson.preserve.includes('culture_library'));
  assert.ok(!('audio_urls' in lesson) && !('mastery_override' in lesson));
});
check('review policy prevents automatic spoken certification', () => {
  assert.match(lesson.review_policy, /fluent reviewer/);
  assert.match(lesson.review_policy, /Written prompts/);
});
