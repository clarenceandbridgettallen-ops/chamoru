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
