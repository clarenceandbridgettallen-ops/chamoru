// Review-only curriculum integrity. Does not validate CHamoru pronunciation or fluency.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = new URL('../curriculum/drafts/orthography_foundations_v1.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const cases = [
  ['draft not live', () => assert.match(data.status, /DRAFT_NOT_LIVE/)],
  ['not approved', () => assert.equal(data.publish_approved, false)],
  ['no audio approval', () => assert.equal(data.audio_status, 'NO_APPROVED_SPOKEN_AUDIO')],
  ['official references', () => assert.ok(data.source_links.length >= 3 && data.source_links.every(x => x.startsWith('https://kumisionchamoru.guam.gov/')))],
  ['four unique lessons', () => assert.equal(new Set(data.lessons.map(x => x.id)).size, 4)],
  ['twelve original prompts', () => assert.equal(data.lessons.flatMap(x => x.practice).length, 12)],
  ['each lesson independent recall', () => assert.ok(data.lessons.every(x => x.practice.some(y => y.mode === 'independent_recall')))],
  ['prompts nonempty', () => assert.ok(data.lessons.every(x => x.practice.every(y => typeof y.prompt === 'string' && y.prompt.length > 35)))],
  ['sources resolve', () => assert.ok(data.lessons.every(x => Number.isInteger(x.source_index) && data.source_links[x.source_index]))],
  ['progress and mastery preserved', () => assert.ok(['saved_progress', 'mastery_gates', 'culture_library', 'back_next'].every(x => data.preserve.includes(x)))],
  ['fluent review gate', () => assert.ok(data.review_gates.includes('fluent_speaker_written_review'))],
  ['no pronunciation release', () => assert.ok(data.review_gates.includes('no_audio_release_without_pronunciation_review'))]
];
for (const [label, test] of cases) { test(); console.log('PASS ' + label); }
console.log(cases.length + '/' + cases.length + ' structural tests passed. NOT language or audio validation.');
