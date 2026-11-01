/**
 * Offline, REVIEW-ONLY speech-unit planning for a future original CHamoru voice.
 * This is NOT a voice, pronunciation dictionary, synthesis engine or app asset.
 * It deliberately refuses to invent a sound for an unreviewed grapheme.
 *
 * Orthography references (not copied): Kumisión i Fino' CHamoru,
 * Utugrafihan CHamoru Guåhan (2024), and its CH/NG single-letter guidance.
 * https://kumisionchamoru.guam.gov/utugrafihan-chamoru-guahan/
 * https://kumisionchamoru.guam.gov/chamorro-grammar-as-dr-sandra-chung/
 * This original source contains no third-party audio or voice model.
 */
'use strict';
const { tokenizeWrittenCHamoru } = require('./segment_chamoru_graphemes');
const CANDIDATES = Object.freeze({ch: 't͡s', ng: 'ŋ'});
const STRESS_BASE = Object.freeze({'á':'a','ǻ':'å','é':'e','í':'i','ó':'o','ú':'u'});
function planSpeechUnits(input) {
  const written = tokenizeWrittenCHamoru(input);
  const units = written.map(token => {
    const glyph = token.text;
    const lower = glyph.toLocaleLowerCase('en-US');
    const base = STRESS_BASE[lower] || lower;
    if (token.kind === 'separator') return {glyph,kind:'separator',candidateIpa:null,needsReview:false};
    if (token.kind === 'glottal-marker') return {glyph,kind:'glottal-candidate',candidateIpa:'ʔ',needsReview:true};
    if (token.kind === 'review-required') return {glyph,kind:'unsupported',candidateIpa:null,needsReview:true};
    if (Object.prototype.hasOwnProperty.call(CANDIDATES,base))
      return {glyph,kind:'provisional-phoneme',candidateIpa:CANDIDATES[base],needsReview:true};
    return {glyph,kind:'unmapped-letter',candidateIpa:null,needsReview:true};
  });
  return {
    status:'OFFLINE_DRAFT_NOT_APPROVED',
    sourceText:input.normalize('NFC'),
    units,
    unresolved:units.filter(x=>x.needsReview).length,
    readyForSynthesis:false,
    audioGenerated:false,
    publishApproved:false,
    fluentReviewRequired:true,
    dialect:'Guåhan orthography reference; spoken variants not validated'
  };
}
module.exports = { planSpeechUnits };

