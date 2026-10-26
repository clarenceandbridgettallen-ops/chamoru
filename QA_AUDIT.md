# CHamorU QA Audit

## 2026-10-26 UTC | Android phoneme playback stall recovery

- Source reviewed: main commit 60e66126a3, `index.html` v3.9 audio diagnostics.
- Fixed: `u0PlayRecordedPhoneme` now has a 7-second watchdog and explicit stalled/failed-start/error feedback. This prevents an unresolved `Audio.play()` from trapping the guided sound sequence indefinitely in some Android in-app browsers.
- Code commit: `e291203edca12a7a8a1707a90521a7a55ba0624f`.
- Verification: JavaScript parsed successfully using `new Function`; isolated fake-Audio never-resolving-playback test confirmed timeout resolution, timer cleanup and visible stalled status. GitHub Actions run 40260815140 passed.
- NOT VERIFIED: sound heard on a physical Android phone, real device playback timing, CHamoru pronunciation, fluent-speaker approval, or a real mobile-browser end-to-end journey. English/recorded phonemes remain approximations, not authoritative language models.
- Data/UX: no storage keys, mastery gates, navigation, rewards or curriculum content changed.
- Next: real Android speaker check using Test Sound/CH/A; add robust timeout/error handling for the separate speech-synthesis sequence, then obtain fluent-speaker audio review.

## 2026-10-26 UTC | Embedded greeting MP3 start watchdog

- Source reviewed: recent greeting audio commits 54237a0a4111, f0d194f7b9f1 and the existing direct-MP3 player in index.html.
- Code commit: f4e496bb36e05cbee7ae8ca133973f27af892685.
- Fixed: direct MP3 greeting now handles player-constructor failure and reports a 7-second non-start, with timer cleanup on play/end/error and when a second greeting replaces the first.
- Verified: updated inline JavaScript parsed using the JavaScript Function constructor before committing. This is a syntax check, NOT a real audio or phone test.
- Not verified: audible Android in-app playback, embedded MP3 decoding on the target phone, fluent-speaker pronunciation, or complete lesson journeys. The embedded audio remains explicitly labeled computer-generated approximation.
- No progress keys, rewards, mastery gates, lesson text, or navigation changed.
- Next: run a physical Android beep / greeting test; test watchdog with a controlled browser Audio stub and obtain fluent-speaker review before approving pronunciation.
