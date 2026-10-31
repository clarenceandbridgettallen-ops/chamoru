'use strict';
const assert = require('node:assert/strict');
const { tokenizeWrittenCHamoru: tokenize } = require('./segment_chamoru_graphemes.js');
const check = (label, fn) => { fn(); console.log('PASS', label); };
const letters = text => tokenize(text).filter(x => x.kind === 'letter').map(x => x.text);
check('CH is one written letter, not English ch sound', () => {
  assert.deepEqual(letters('CHamoru'), ['CH','a','m','o','r','u']);
  assert.deepEqual(letters('chamoru'), ['ch','a','m','o','r','u']);
});
check('NG is one written letter in uppercase and lowercase', () => {
  assert.deepEqual(letters('NGånga’'), ['NG','å','ng','a']);
});
check('å stays distinct from a', () => {
  assert.deepEqual(letters('Håfa adai'), ['H','å','f','a','a','d','a','i']);
});
check('Unicode decomposed å is NFC-normalized without losing accent', () => {
  assert.deepEqual(letters('Ha\u030afa'), letters('Håfa'));
});
check('glottal markers are not silently discarded or treated as vowels', () => {
  assert.deepEqual(tokenize("Yu’os").filter(x => x.kind === 'glottal-marker').map(x => x.text), ['’']);
  assert.deepEqual(tokenize("Yu'os").filter(x => x.kind === 'glottal-marker').map(x => x.text), ["'"]);
});
check('written stress marks are retained, not assigned phonemes', () => {
  assert.deepEqual(letters('dǻngkolo'), ['d','ǻ','ng','k','o','l','o']);
  assert.equal(tokenize('gé’helo’')[1].text, 'é');
});
check('foreign letters remain visible for human review, not automatically rejected', () => {
  const t = tokenize('Cruz');
  assert.deepEqual(t.filter(x => x.kind === 'review-required').map(x => x.text), ['C','z']);
});
check('spaces and punctuation are kept as separators', () => {
  assert.deepEqual(tokenize('Håfa?').slice(-1), [{ text:'?', kind:'separator' }]);
  assert.ok(tokenize('Håfa adai').some(x => x.text === ' ' && x.kind === 'separator'));
});
check('rejects non-string and overlong input safely', () => {
  assert.throws(() => tokenize(null), TypeError);
  assert.throws(() => tokenize('a'.repeat(2049)), TypeError);
});
check('no synthesis, audio, network, storage or grading entrypoints', () => {
  const api = require('./segment_chamoru_graphemes.js');
  assert.deepEqual(Object.keys(api), ['tokenizeWrittenCHamoru']);
});
