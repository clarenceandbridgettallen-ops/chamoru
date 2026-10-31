# CHamorU Audio, Video & Content Recovery Audit

**Date:** 2026-10-30 (US Eastern)  
**Status:** Historical reconstruction from available project conversation context, public source history, connected Drive searches, local-storage report, and verified external publisher pages. This is not a guarantee of rights to redistribute third-party material.

## Executive finding

CHamorU gained lesson UX, mastery gates, reading previews, games, automated QA and an optional local recorder, **but it never carried the old multimedia prototypes or researched publishers' videos into the published GitHub repository.** Later UX navigation hides several existing activities until the learner finishes earlier steps. Most vocabulary sound buttons originally depended on device speechSynthesis; this failed in the user's Android browsers even while the speaker beep worked. Local Family Voice Studio can store family clips, but the public repo has no preloaded approved CHamoru audio recordings. This explains the apparent regression in content and sound.

## Evidence timeline

| Date | Event | Current evidence |
|---|---|---|
| 2026-10-08 | Public audio/video resources researched for CHamoru and homeschool learning | PBS Guam Manåmko' to Manhoben and Lost Language documentary, Guampedia multimedia and seafaring, LearningCHamoru and Lengguahi-ta |
| 2026-10-11 | Separate generated audio prototypes v0.3 and standalone v0.4 made in project discussion | `CHamoru_for_YOU_Experimental_Voice_v0.3.zip`, `CHamoru_for_YOU_Standalone_Audio_v0.4.zip`; older discussion said v0.4 included 10 self-generated audio samples, NOT verified native recordings. These ZIPs are not located in accessible Library/Drive and are not in GitHub main. |
| 2026-10-11 | Large experimental WAV | Storage-report evidence: `C:\Users\clear\Downloads\CHamoru-original-experiment-v1.3.wav` and `... (1).wav`, each 55.6 MB, as of 2026-10-26. Prior project note describes v1.3 as robotic and nearly silent despite duration near 20 minutes. Current laptop filesystem not directly accessed. Preserve before cleaning. |
| 2026-10-12 | Original synthesis plan discussed | User preferred an original custom/AI CHamoru voice built from spelling and phonics, rather than depending on Dad's voice or external recordings. Authentic fluent-speaker review and cultural correctness were still requirements. |
| 2026-10-13 | Public GitHub repo launched | First substantive commit `55ee1e3168fe...` published a self-contained interactive prototype. By this stage no video iframe, licensed audio file, or uploaded external clips were included. |
| 2026-10-17 to 26 | Numerous attempts to fix phoneme/greeting playback | Various generated phoneme clips, English/Spanish text-to-speech and an embedded provisional greeting MP3; many simulated watchdog tests. User confirmed sound-test beep audible, while spoken vocabulary silent in Chrome and ChatGPT in-app browser. |
| 2026-10-26 to 30 | Family Voice Studio and independent learning checks expanded | The optional recorder uses IndexedDB in each browser; new installs have **zero saved recordings** until someone records/imports. App got more tests and harder mastery gates; no approved speech dataset was added to repository. |
| 2026-10-30 | Investigated original research and restored discovery route | Public repo tree at `53ae781c1a4f...` had 11 tracked paths, none standalone audio/video. The current `index.html` contained no `<video>`, `<iframe>`, YouTube or PBS/Guampedia embedded source links. Added `Culture & Audio Library v4.7` with seven publisher links, prominent Home and Practice access, Back/Next, without touching learning progress or rehosting media. Commit `cef7b88c2d93...`; 5/5 new media-library source tests passed locally and GitHub audio QA run `41162599222` succeeded with follow-on workflow commit `6b010ca19f0f...`. Deployment of that workflow commit should be checked separately before declaring the public page updated. |

## Why it looks smaller

- The original `home()` function listed multiple quests and optional modes. The newer `home=function(){...}` override re-rendered a simplified guided hero with only several shortcuts. It did **not** delete `gamesHome`, `storyHome`, `readerOpen`, or dialogue functions.
- `guidedPath()` only unlocks the next unfinished item and repeats completed ones. `guidedPractice()` grays optional tiles behind completion conditions. This makes the app look much less complete to a new learner. Unlocking all formal course activities would falsely bypass mastery; we restored *discovery*, not course credit.
- Starter Unit 1 still cycles only four core phrases across eight lessons. That is a curriculum-content bottleneck, distinct from loss of preexisting media assets.

## Asset inventory and rights

| Source | Availability | Reuse caution |
|---|---|---|
| Color Guam: https://www.colorguam.com/activity-book-audio/ | Official website hosts playable CHamoru and English MP3 | External reference only, no verified commercial reuse license |
| UCLA phonetics archive: https://archive.phonetics.ucla.edu/Language/CHA/cha.html | Archival word-list WAV and MP3 on archive site | Rights/source voice and commercial usage must be reviewed |
| Lengguahi-ta: https://lengguahita.com/free-beginner-chamorro-lessons/ | Free beginner lessons; some audio pending update | Link only, do not copy embedded lesson media |
| LearningCHamoru: https://www.learningchamoru.com/ | Dictionary, lesson, grammar, dialogue, media; free signup | Link only; no permission established to clone curriculum |
| PBS Guam elders: https://www.pbsguam.org/higher-learning/manamko-to-manhoben/ | Original oral-history/video collection | Publisher-owned material, do not rip or republish |
| Guampedia multimedia: https://www.guampedia.com/explore-more/ | Audio/video/culture resources | External reference with source attribution |
| Guampedia seafaring: https://www.guampedia.com/for-the-seafarers/ | History and related seafaring media | External reference |
| `CHamoru-original-experiment-v1.3.wav` | Present in October 26 laptop report only, not verified today | Prior experiment was mostly inaudible; not ready as teaching audio |
| v0.3/v0.4 ZIPs | Mentioned in Oct 11 ChatGPT project history, not found as currently accessible files | Needs retrieval from original saved session/download if still available |
| CHamorU Family Voice Studio (IndexedDB) | Browser-local only, not synced or preloaded in public site | Can record user-authorized audio, but not a built-in product voice library |

## Architectural recovery commitments

1. **Preserve all progress, UX and code**. Do not reset saved localStorage/IndexedDB or revert the app to a detached prototype. Keep Back, always-visible Next, games, mastery and family tracks.
2. **Restore discovery of the full experience**. Home and Practice should always expose research and culture resources. Existing unlocked activities should remain findable. New users should be able to preview the course map without falsely earning credit.
3. **Rebuild the original custom AI speech plan** from documented CHamoru spelling/phoneme rules and real, licensed or explicitly approved speech reference validation. Do not market current English/Spanish device TTS as authentic or require father's recordings as a prerequisite. Existing Family Voice Studio remains optional.
4. **No unlicensed audio extraction**. Publisher audio/video may be linked to, not downloaded into commercial app unless reuse and derivative rights are verified. Record rights status and provenance for each proposed sample.
5. **Recover prototypes**. The historical filenames above are leads, not currently recovered bytes. If found, inspect audio duration, signal energy, speech quality and copyright provenance before integration.
6. **Strengthen curriculum**. Move beyond four repeatedly recycled starter words; add sourced vocabulary, dialogues, listening only after correct approved audio, progressive grammar/reading/writing and mastery checks.
7. **Audit device outcomes separately**. GitHub Pages/CI and fake browser tests do not prove audible Android output. User's actual silent-speech finding remains a high-priority unresolved device result.
8. **Never overwrite user-approved features during automated runs.** Read this report and `QA_AUDIT.md` before edits.

## Links to evidence
- [GitHub main](https://github.com/clarenceandbridgettallen-ops/chamoru)
- [First substantive GitHub prototype commit](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/55ee1e3168fecc468f5256ff1c2496c4419a229d)
- [Media library UI restore](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/cef7b88c2d931c2506102a40649c684d64139fbb)
- [QA run with media-library regression tests](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/41162599222)
- [Existing detailed technical QA](./QA_AUDIT.md)

**Bottom line:** Most "missing" content was either an earlier separate prototype, external research not imported into the published app, or existing code obscured by a gated UI. The fix is to recover and reintroduce assets with provenance and rights while restoring discovery and the original custom-voice roadmap, not to keep shipping invisible audio patches.


## 2026-10-31 00:44 ET | New signal-measurement prerequisite (no recovered audio)

New offline Python-standard-library `scripts/check_voice_wav.py` plus `scripts/test_check_voice_wav.py` committed at `c1edd92c` and `b70941f`. 11/11 synthetic WAV tests passed locally, exact committed blob hashes verified. The analyzer reports signal RMS, peak, silence fraction, clipping and DC offset, rejecting silent/mostly silent test signals. This creates a reproducible gate for future original speech candidates and the historical mostly-silent WAV **if its bytes are recovered**. It does not synthesize a voice, detect intelligible words, approve CHamoru pronunciation, test Android playback, or grant commercial media rights. Old v0.3/v0.4 ZIPs and v1.3 WAV remain unrecovered. Seven v4.7 attributed external discovery links and original learner experience preserved. No private audio uploaded or media published.

## 2026-10-31 01:44 ET | Offline MP3/Opus round-trip signal QA (experimental, NOT speech approval)

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md reviewed before edits. Public main before code 85b9f8c863ec15de249b7f53a30d58ba01cc9889. Culture & Audio Library v4.7 source blob ee8fdc2d2d91ce181ad09a74f42f1431adb81b55 remains untouched; original v0.3/v0.4 ZIP and 55.6 MB experimental WAV remain unrecovered. Pages run 41170227561 for pre-code HEAD 85b9f8c completed SUCCESS (build/deploy/report); this is NOT independent served-byte, phone, or new-commit deployment verification.

**CODE UPDATED / LOCAL TESTED:** scripts/check_encoded_voice.py commit 0b2ce47c95a16a5ff8eddbc341f411ac837884b9 and scripts/test_check_encoded_voice.py commit 70d03efd7dcd25cd4a643506300d53293d32d1f4. Free, optional local FFmpeg/ffprobe used to decode original PCM WAV and encoded MP3/Opus into bounded 16 kHz mono PCM, comparing RMS level, silent-window proportion and duration. No network, media copies, uploads or app UI changes. 9/9 fresh local pytest cases PASS (MP3, Opus, muted encoded, silent source, duration mismatch, symlink, corruption, short clip, filename privacy), using synthetic sine-wave fixtures. GitHub readback SHA matched exact locally tested files: b8b08a7f886a0e934001885abf9c88fbc6ae468c and fa04aa5144c2d516f5e654288e0aba177a70b66b. Both code commits used [skip ci] to avoid potentially metered jobs.

**LIMITATIONS:** A tone can pass this codec signal gate without being intelligible speech. No original CHamoru synthesized word, approved pronunciation, commercial rights, Android playback, actual codec support on user's phone, or two-device transfer has been established. Never treat beep or tone as speech. Next: source/rights-clear a genuine original synthesis pipeline, test a real word's PCM and encoded versions, seek fluent-speaker review, and then verify actual Android playback. All learner progress, mastery gates, reader, games, discovery links and private voice storage untouched.

**01:44 ET follow-up hardening:** FFmpeg PCM output is now capped at 31 seconds and MAX_DECODE_BYTES+1 before being collected into memory, limiting oversized decoded streams. Source commit 606f4d2c08359d4595b6e3fbd32fc104b9906531, exact readback Git blob d9a62aaa2b27d399063c5eeb0010a2831afda62b. Re-ran same 9/9 local pytest cases PASS (1.92s); tests file unchanged. This remains codec-signal-only QA, not voice synthesis, Android listening or pronunciation. [skip ci] used.

## 2026-10-31 02:47 ET | First locally synthesized speech candidate (UNREVIEWED; NOT published)

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md reviewed before any change; baseline main d4584e3e7c7e55286aaabcb596a717edd0d82cf4. Current v4.7 Culture & Audio Library, seven externally attributed discovery sources, games, learner progress, sound gates, reader, Back/Next and all local voice keys were left unchanged.

**CODE UPDATED + LOCALLY TESTED:** Added `scripts/prototype_speech_candidate.py` (commit `1cdaf8a3242e57aa5bf4f9f8311a06344b7f8f86`, blob `b8e4f3b2d9314df02cca8458cd06591b3bfd4765`) and `scripts/test_prototype_speech_candidate.py` (commit `1ffa95bb7a6eacbfb96b6de78f9ab90c4f38e300`, blob `2ab1ad3802b4ed93f36135c138c6e006d2072ec2`). Exact GitHub blobs matched locally tested files. Python compilation passed; **9/9 pytest tests passed** including a real local eSpeak subprocess, silence rejection, short WAV, overwrite/symlink refusal, timeout/error cleanup. Independent local eSpeak 1.48.15 synthesized an actual 2.051-second 22,050-Hz mono PCM WAV with -16.43 dBFS RMS. This is speech-engine output, not merely a beep/tone. The local experimental WAV (89 KB) was **not** committed, published, uploaded or put into learner playback.

**CRITICAL LIMITS:** The phrase `Håfa adai` is fed to an English eSpeak engine via a deliberately crude phonetic placeholder `hah fah ah dye`; **NOT** a native CHamoru model, approved transcription, intelligibility result, authentic pronunciation or production asset. No actual listening or Android test occurred. eSpeak's GPL and voice-data obligations require review before any distribution; neither a commercial redistribution grant nor rights to third-party research recordings are asserted. Original v0.3/v0.4 ZIPs and 55.6-MB WAV remain unrecovered. No learner or family recording was read. The command requires explicit `--unreviewed-experiment`, creates a new local file only, refuses overwrites, and never uploads. Both commits used [skip ci] to avoid potentially metered Actions.

**NEXT:** Measure MP3/Opus round-trip of this actual synthetic speech with existing check_encoded_voice.py; compare with a fluent speaker's CHamoru phonology review (2024 Kumisión orthography and Sandra Chung's grammar are research references, not licenses for copying media); design a CHamoru-specific phoneme mapping/model with verified distribution terms, then test audible Android playback and listener intelligibility before any app integration.

**02:48 ET follow-up (local codec signal only):** The same unreviewed eSpeak candidate was converted offline using local FFmpeg to MP3 and Opus and decoded to 16-kHz mono PCM for comparison. Decoded durations: WAV 2.051 s, MP3 2.051 s, Opus 2.051 s; RMS: WAV -16.43 dBFS, MP3 -16.43 dBFS, Opus -16.60 dBFS. This shows preserved measured signal, NOT intelligible or culturally accurate speech, phone playback, or cleared output licensing. No candidate audio published or uploaded.


### 2026-10-31 03:44 ET follow-up: candidate tail-silence measurement, no media recovery

An independent local PCM inspection of the existing *unreviewed* 2.051-s English-eSpeak experimental WAV found 22,050-Hz mono audio, 0% clipped samples, peak amplitude ~0.902 full scale, and approximately 0.559 s (27.3%) of trailing samples below -46 dBFS. This does not validate spoken-word audibility on Android, intelligibility, CHamoru pronunciation, licensing or rights to distribute the engine output. The original 2026-10-11 audio ZIPs and 55.6-MB mostly silent WAV remain unrecovered. No recording was uploaded or published. Separate 16-pair greetings curriculum draft is explicitly not live and has no approved audio; see QA_AUDIT.md.


### 2026-10-31 11:44 ET | Rights-aware neural voice research lead, no recovered audio
Official Kokoro-82M model card (https://huggingface.co/hexgrad/Kokoro-82M) labels its 82M open weights Apache-2.0, but lists **no CHamoru support**. Candidate only for a possible free local waveform engine after independent review of voice-pack, dependency, phonemizer and output terms. No model downloaded/run, no CHamoru speech synthesized or approved, no audio licensed/copied/published, no phone listening performed. The original Oct 11 ZIPs and mostly-silent 55.6 MB WAV remain unrecovered. See QA_AUDIT.md for validation gates.

## 2026-10-31 12:47 ET | Original CHamoru orthography tokenizer, NOT speech

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md inspected before code changes, along with recent commits and Pages history. The 2024 Kumisión Utugrafihan CHamoru Guåhan (https://kumisionchamoru.guam.gov/wp-content/uploads/2025/02/Utugrafihan-CHamoru-GuA%C2%A5han-3rd-Ed-2024_KumisiA%C2%B3n-i-Fino-CHamoru_Digital.pdf), alphabet and Rule 2(D), explicitly treats CH and NG as single written letters. Its text/media remain publisher-owned and were NOT copied into the repo.

**CODE UPDATED + LOCAL TESTED:** Added scripts/segment_chamoru_graphemes.js commit 7ebfcdd382c6c1a35bd3528033963de68801073e (blob 89c87c0846b8900e4f43f853b2f1db123ad7ed28) and scripts/test_segment_chamoru_graphemes.js commit 761d8eb58921999d28935e3e5120ee1ae5462113 (blob 9c2381cf08192135542a212e0977233fcc0f593f). **10/10 actual local Node assertions PASS**, plus both node --check syntax checks PASS. Exact GitHub blob SHAs matched tested local files. This non-live original code tokenizes written CH/NG as single units, preserves å versus a, acute marks and glottal symbols, handles Unicode NFC, flags unusual letters for human review rather than rejecting proper names, and enforces input limits.

**IMPORTANT LIMIT:** Written grapheme segmentation is NOT phoneme assignment, native speech synthesis, intelligibility, Android listening, fluent pronunciation validation, or license clearance for any third-party media/model. No sound generated, downloaded, or published. Learner index.html, v4.7 seven external culture links, games, dialogue, reader, saved progress, Back/Next and mastery gates untouched. Original Oct 11 ZIPs and mostly-silent 55.6 MB WAV still unrecovered. Both code commits [skip ci]; no new Pages deployment is claimed. Next: develop and review contextual grapheme-to-phoneme rules separately, then use an appropriately licensed original speech backend, real PCM/codec signal QA and fluent/Android listening before learner release.
