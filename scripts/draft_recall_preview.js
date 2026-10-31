'use strict';
// Offline review tool only. No app state, audio, progress or network access.
// This file is intentionally not imported by the public learner app.
const fs = require('node:fs');
const path = require('node:path');

function assertDraft(draft) {
  if (!draft || draft.schema !== 'chamoru-curriculum-draft-v1' ||
      draft.publish_approved !== false || draft.audio_status !== 'NO_APPROVED_SPOKEN_AUDIO' ||
      draft.pronunciation_status !== 'NOT_REVIEWED' || !Array.isArray(draft.phrases) ||
      draft.phrases.length < 4 || !Array.isArray(draft.lesson_flow) ||
      draft.lesson_flow.join('|') !== 'meaning_recognition|typed_english_meaning|typed_chamoru_recall') {
    throw new Error('Requires an unapproved written-only CHamoru draft with all three exercise modes');
  }
  const seen = new Set();
  const meanings = new Set();
  for (const p of draft.phrases) {
    if (typeof p.chamoru !== 'string' || !p.chamoru.trim() ||
        typeof p.english !== 'string' || !p.english.trim() ||
        typeof p.source !== 'string' || !draft.sources || !draft.sources[p.source]) {
      throw new Error('Invalid phrase or missing source attribution');
    }
    const id = p.chamoru.normalize('NFC').toLocaleLowerCase('en');
    if (seen.has(id)) throw new Error('Duplicate phrase');
    seen.add(id);
    const meaning = p.english.trim().normalize('NFC').toLocaleLowerCase('en');
    if (meanings.has(meaning)) throw new Error('Ambiguous duplicate meaning');
    meanings.add(meaning);
  }
}
function seeded(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid preview seed');
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
function shuffle(items, random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function makePreview(draft, seed = 1) {
  assertDraft(draft);
  const random = seeded(seed);
  const items = shuffle(draft.phrases, random);
  const questions = [];
  for (const item of items) {
    const wrong = shuffle(draft.phrases.filter(p => p.chamoru !== item.chamoru && p.english !== item.english), random);
    if (wrong.length < 2) throw new Error('Not enough distinct meanings for recognition');
    const options = shuffle([item.english, ...wrong.slice(0, 3).map(p => p.english)], random);
    if (new Set(options).size !== options.length) throw new Error('Ambiguous duplicate meaning options');
    questions.push({mode: 'meaning_recognition', prompt: item.chamoru, options, source: item.source});
    questions.push({mode: 'typed_english_meaning', prompt: item.chamoru, source: item.source});
    questions.push({mode: 'typed_chamoru_recall', prompt: item.english, source: item.source});
  }
  return Object.freeze({status: 'REVIEW_ONLY_NOT_LIVE', pronunciation: 'NOT_REVIEWED',
    graded: false, progress_written: false, questions});
}
if (require.main === module) {
  if (process.argv.length !== 3 || process.argv[2] !== '--review-only') {
    console.error('Usage: node scripts/draft_recall_preview.js --review-only');
    process.exitCode = 2;
  } else {
    const draft = JSON.parse(fs.readFileSync(path.join(__dirname, '../curriculum/drafts/greetings_recall_v1.json'), 'utf8'));
    const preview = makePreview(draft, 20261031);
    console.log(JSON.stringify({status: preview.status, graded: preview.graded,
      progress_written: preview.progress_written, count: preview.questions.length,
      modes: [...new Set(preview.questions.map(q => q.mode))]}, null, 2));
  }
}
module.exports = {assertDraft, makePreview};
