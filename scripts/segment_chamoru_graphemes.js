/**
 * Experimental, NON-LIVE CHamoru written-grapheme tokenizer.
 * NOT a grapheme-to-phoneme model, voice, pronunciation approval, spellchecker,
 * or license to copy the cited reference. Preserve the input's actual glyphs.
 *
 * Rule reference (not reproduced): Kumisión i Fino' CHamoru, Utugrafihan
 * CHamoru Guåhan (2024), alphabet and Rule 2(D): CH and NG are single letters.
 * https://kumisionchamoru.guam.gov/wp-content/uploads/2025/02/Utugrafihan-CHamoru-GuA%C2%A5han-3rd-Ed-2024_KumisiA%C2%B3n-i-Fino-CHamoru_Digital.pdf
 * Copyright 2024 Kumisión. This independently written code copies no media.
 */
'use strict';

const BASIC_LETTERS = new Set('a å b ch d e f g h i k l m n ñ ng o p r s t u y'.split(' '));
const STRESS_BASE = Object.freeze({ 'á': 'a', 'ǻ': 'å', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' });
const GLOTTAL_MARKS = new Set(["'", '’', 'ʼ']);

function tokenizeWrittenCHamoru(input) {
  if (typeof input !== 'string' || input.length > 2048) {
    throw new TypeError('Expected CHamoru text string of at most 2048 UTF-16 units');
  }
  const chars = Array.from(input.normalize('NFC'));
  const result = [];
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const pair = ch + (chars[i + 1] || '');
    if (/^(ch|ng)$/iu.test(pair)) {
      result.push({ text: pair, kind: 'letter' });
      i += 1;
    } else if (GLOTTAL_MARKS.has(ch)) {
      result.push({ text: ch, kind: 'glottal-marker' });
    } else if (/^\s$/u.test(ch) || /^[.,!?;:()\-]$/u.test(ch)) {
      result.push({ text: ch, kind: 'separator' });
    } else {
      const lowered = ch.toLocaleLowerCase('en-US');
      const base = STRESS_BASE[lowered] || lowered;
      result.push({ text: ch, kind: BASIC_LETTERS.has(base) ? 'letter' : 'review-required' });
    }
  }
  return result;
}

module.exports = { tokenizeWrittenCHamoru };
