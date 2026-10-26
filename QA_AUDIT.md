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

- Follow-up correction commit 4e7e827c87ca73eb1cca77871e7f167a0fd8d8d0: changed watchdog to track the actual onplaying event rather than HTMLMediaElement.paused (which can be false while buffering). Isolated simulated Audio tests verified both non-start timeout and onplaying recovery; no physical device audio test. Final GitHub Pages Actions run status must be checked separately.

## 2026-10-26 UTC | Stalled greeting player cleanup

- Inspected latest source and commits 461289c2a5, 4e7e827c87, plus GitHub Actions run 40266049532 (success).
- Code commit: 0161c780a8c21cc915fe82195f17c2765cbf5d9c, index.html.
- Fixed: direct greeting's 7-second non-start watchdog now pauses and releases its Audio object, clears the timer, invalidates stale callbacks and keeps the failure message visible. Decode errors and rejected/throwing play calls share the same cleanup path.
- Tested: full inline JavaScript compiled with Function constructor; isolated fake-Audio timeout test confirmed pause, released player, and late onplaying could not overwrite failure feedback. GitHub Actions run 40270933236 completed successfully on this code commit.
- NOT VERIFIED: sound heard on Android, real MP3 decoding on an in-app browser, complete lesson journeys, or fluent CHamoru pronunciation. The embedded clip is still labeled computer-generated approximation, not native-reviewed.
- Data/UX: no progress keys, navigation, mastery, rewards or curriculum changed.
- Next: obtain real Android Test Sound / greeting observations and fluent-speaker review before declaring audio or pronunciation correct.


## 2026-10-26 UTC | Direct CH phonics playback watchdog

- Inspected current index.html, existing Unit 0 recorded-phoneme helper, recent main commits, and the latest Pages workflow history.
- Code commit: 701c44417e309f739fe1f25b63be04c35a577349.
- Fixed: the direct CH phonics button now uses the same seven-second stalled-media watchdog as sequential recorded phonemes. Ended/error/timeout settle exactly once; a stopped or replaced attempt cannot overwrite newer status. Successful clip completion is explicitly labeled an unreviewed approximation.
- Verified before commit: three simulated Audio outcomes (ended, stalled timeout, decode error), status feedback, and JavaScript parsing of the CH symbol handler. No real audio output was measured.
- Pages deployment run 40275956567 was in progress at this audit entry. Its completion and the final audit commit's deployment must be checked independently.
- NOT VERIFIED: actual Android in-app sound, user hearing the clip, accurate CHamoru phonetics, or full course journeys. Fluent CHamoru speaker review remains mandatory.
- Preserved: progress keys, navigation, rewards, mastery gates, lessons, and storybook. No paid tools or unapproved content.
- Next: verify actual Android speaker test and CH playback; check GitHub Pages workflow; pursue fluent-speaker review.

- Follow-up constructor guard: commit 0d16f3b3d4214d0dc345b3684f4d155b4327b113 catches Audio constructor failures in the recorded-phoneme helper, reports Chrome recovery guidance, and resolves false. A simulated constructor-throw test passed. No actual Android sound or pronunciation verified. Latest Pages run requires separate verification.

## 2026-10-26 UTC | Vowel TTS stall and stale-callback protection

- Inspected latest main source and commits, Unit 0 speaker test, CH and A/Å handlers, previous audio watchdog fixes, and QA audit.
- Code commit: edd867928c2d92c46e86def37d1022e8dfd7f62d. Vowel TTS now times out after seven seconds with recovery guidance, and stopped/replaced speech callbacks cannot overwrite a newer status. UI calls it an English vowel example, NOT verified CHamoru pronunciation.
- Tested: complete embedded JavaScript parsed; three simulated speech outcomes passed (stalled playback with late completion, normal completion, and stopped playback ignoring stale callbacks). GitHub Actions workflow 40281767564 completed SUCCESS for the code commit.
- NOT VERIFIED: actual Android audio, the listener hearing the sound, native speaker approval, live browser journeys or authoritative phonics. No progress keys, rewards, mastery, course content, navigation or local storage format changed.
- Next: verify physical Android Test Sound / CH / A with user observations; require fluent-speaker sign-off before marking any CHamoru phonics audio authoritative.

