'use strict';
// Local, read-only reviewer handoff. Never grades, approves, records or publishes.
const fs = require('node:fs');
const path = require('node:path');

function buildReviewPacket(draft) {
  if (!draft || draft.schema !== 'chamoru-curriculum-draft-v1' ||
      draft.status !== 'DRAFT_NOT_LIVE_FLUENT_REVIEW_REQUIRED' ||
      draft.publish_approved !== false ||
      draft.audio_status !== 'NO_APPROVED_SPOKEN_AUDIO' ||
      draft.pronunciation_status !== 'NOT_REVIEWED' ||
      !Array.isArray(draft.phrases) || !draft.phrases.length ||
      !draft.sources || typeof draft.sources !== 'object') {
    throw new Error('Only an explicitly unapproved, silent curriculum draft can be reviewed');
  }
  const seen = new Set();
  const entries = draft.phrases.map((p, i) => {
    if (!p || typeof p.chamoru !== 'string' || !p.chamoru.trim() ||
        typeof p.english !== 'string' || !p.english.trim() ||
        typeof p.source !== 'string' || !Object.hasOwn(draft.sources, p.source)) {
      throw new Error('Phrase or source is missing');
    }
    const url = draft.sources[p.source];
    if (typeof url !== 'string' || !/^https:\/\/[a-z0-9.-]+\//i.test(url)) {
      throw new Error('Review source must be an attributed HTTPS URL');
    }
    const key = p.chamoru.trim().normalize('NFC').toLocaleLowerCase('en');
    if (seen.has(key)) throw new Error('Duplicate phrase requires reconciliation');
    seen.add(key);
    const flags = [];
    if (/\.{3}|…/.test(p.english) || /\.{3}|…/.test(p.chamoru)) flags.push('INCOMPLETE_TEMPLATE_NEEDS_CONTEXT');
    if (/[\u2018\u2019]/.test(p.chamoru)) flags.push('CHECK_APOSTROPHE_ORTHOGRAPHY');
    return {
      number: i + 1,
      chamoru_as_written: p.chamoru,
      english_draft: p.english,
      source_url: url,
      flags,
      spelling_review: 'PENDING_FLUENT_REVIEW',
      meaning_and_register_review: 'PENDING_FLUENT_REVIEW',
      pronunciation_review: 'PENDING_FLUENT_REVIEW'
    };
  });
  return {
    status: 'REVIEW_ONLY_NOT_PUBLISHABLE',
    audio_status: 'NO_APPROVED_SPOKEN_AUDIO',
    source_draft_id: draft.id,
    entries,
    disclaimer: 'This packet does not approve any phrase, pronunciation, media rights or graded lesson.'
  };
}

if (require.main === module) {
  if (process.argv.length !== 3 || process.argv[2] !== '--review-only') {
    console.error('Usage: node scripts/build_fluent_review_packet.js --review-only');
    process.exitCode = 2;
  } else {
    const file = path.join(__dirname, '../curriculum/drafts/greetings_recall_v1.json');
    console.log(JSON.stringify(buildReviewPacket(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2));
  }
}
module.exports = {buildReviewPacket};
