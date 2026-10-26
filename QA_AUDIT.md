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


## 2026-10-26 UTC | Reading Studio voice startup watchdog

- Inspected current public main da7723e and live page title `CHamorU · Direct MP3 Greeting v4.2`. Reader voice was previously missing a startup watchdog and stale-callback guard, even though the Unit 0 and greeting players already had recovery behavior.
- CODE UPDATED: `index.html` commit `1d49468fbf44a27c0e607fc235414cf3be38e896`. Added seven-second startup timeout, explicit unsupported/failed voice feedback, cancellation of stale callbacks, and cleanup when changing reader pages, language help, or tapping Stop. Did not change progress keys, mastery gates, reward logic, story content or navigation.
- TESTED ONLY: Full embedded JavaScript parsed in V8. Isolated fake-speech checks passed for starting, timeout, late callback ignored, successful start/end and manual stop. These checks do NOT prove Android audible playback or accurate CHamoru pronunciation.
- TRUST GATE: Reading Studio still labels speech as an experimental English approximation; fluent-speaker review is required before it may be presented as authoritative CHamoru. No vocabulary or pronunciations were certified.
- NEXT: Verify GitHub Pages deployment of this exact commit, then physically listen on Android (Test Sound, CH, A and Reader). Record actual speaker observations before marking audio VERIFIED.


## 2026-10-26 UTC | Speaker diagnostic AudioContext watchdog

- INSPECTED: latest public main commit 4c2b345, full index.html speaker diagnostic, phonics helpers and existing QA audit. Site URL could not be independently retrieved through the available web reader; physical Android audio remains unverified.
- CODE UPDATED: index.html commit 7d41c11998d9f3167db8518a236969ee454ec801. Test Sound now closes an AudioContext if resume never resolves, reports a seven-second timeout, closes the context after a finished beep, and ignores callbacks from an older speaker test after another tap. No CHamoru pronunciation samples, storage keys, rewards, mastery gates, lesson content or navigation were changed.
- TESTED ONLY: Complete inline JavaScript compiled with Function constructor; four isolated fake-AudioContext scenarios passed (pending resume timeout and cleanup; normal beep completion; second tap ignores stale completion; rejected resume explains blocking). GitHub readback confirmed the changed file. No actual Android speaker output or audible pronunciation was measured. Push-triggered CI status was not exposed by the available GitHub status endpoint.
- TRUST GATE: The beep is a speaker diagnostic only; English phonetic examples remain unreviewed approximations. Native fluent-speaker review is required before labeling CHamoru pronunciations authoritative.
- NEXT: Verify physical Android Test Sound/CH/A and reading aloud, then capture device/browser version and speaker observations. Do not equate syntax/CI with audible sound.

## 2026-10-26 UTC | Verified latest Pages CI and audio trust-gate audit

- INSPECTED: latest public main 71bf4f43e11ad1ad1168f3264ae0b671a73d73c1, full index.html, previous QA audit and GitHub Pages workflow history. GitHub Actions run 40297354207 completed SUCCESS for that exact commit; run 40297135844 also succeeded for the prior speaker-test implementation.
- TESTED ONLY: source contract checks confirmed seven-second stall guards in speaker beep, recorded phoneme, A/Å vowel speech and Reading Studio; legacy browser storage keys `chamoru_for_you_unit1_v15` / `chamoru_for_you_v16_extras` and mastery key `chamoru_mastery_v30` remain present; experimental English voice and fluent-speaker review warnings remain explicit. All seven static checks passed. No application code changed this run.
- BLOCKED: public URL could not be independently fetched by the available web reader. No physical Android speaker output, actual browser journeys, course mastery, or pronunciation accuracy was verified. A successful Pages job proves deployment workflow completion, not audibility.
- NEXT: owner-device observation of Test Sound, CH, A/Å and Reading Studio in Chrome and the in-app browser, recording whether each is audible; then fluent CHamoru speaker review before language audio is approved. No content, rewards, gates or saved progress changed.

## 2026-10-26 UTC | Executable phoneme audio regression suite

- Inspected current public main source (previous audit commit 835e5792), guided `u0PlayRecordedPhoneme`, speaker diagnostics, and the existing seven-second recovery watchdog.
- CODE UPDATED: Added `scripts/test_phoneme_audio.js` (commit bdf776e51afb7382b7cdc455d6ba4e5aad3245b1) and a read-only GitHub Actions workflow `.github/workflows/audio-qa.yml` (commit 6f5ff1a224911d7dac3debc59ed2e01ac84f3409).
- VERIFIED: Five behavioral mock-Audio cases passed in local Node testing: ended, stalled, rejected play promise, error/synchronous failure, and missing phoneme. GitHub Actions run 40310909085 completed SUCCESS and its `node --test` job passed against the repository's actual `index.html`.
- LIMITATION: These tests simulate browser audio events; they do NOT establish that Android emitted audible sound or that any phoneme is linguistically accurate. Fluent CHamoru review and physical Android testing remain mandatory. Existing learning storage keys, rewards, mastery, navigation, storybook, and lessons were not edited.
- DEPLOYMENT: The new workflow's Pages deployment run 40310907177 was still in progress when checked. Do not claim this audit or source update is live until deployment completes and the public site is checked.
- NEXT: Obtain real phone Test Sound/CH/A results; investigate actual audio permissions/decoding if silent. Add sourced curriculum only after fluent review.


## 2026-10-26 07:47 Eastern | Late audio callbacks and missing-player regression

- INSPECTED: current public main index.html and scripts/test_phoneme_audio.js, recent commits, prior audio QA and Pages deployment status.
- CODE UPDATED: scripts/test_phoneme_audio.js commit 7af831c5918ceb163573bea995ffd5fbaea69c23 adds two behavioral regressions: late error after the seven-second timeout must not overwrite recovery feedback; Audio constructor failure must resolve safely with browser guidance. The tests run against the actual u0PlayRecordedPhoneme function extracted from index.html.
- TESTED: Both scenarios passed in an isolated V8 harness using the current source function. GitHub Actions audio regression run 40317586832 completed SUCCESS for that exact commit. No app code, storage keys, mastery gates, navigation, content or rewards changed.
- DEPLOYMENT: Pages run 40317586443 for the test commit was still IN PROGRESS when checked. A passing workflow is not proof of audible phone playback.
- NOT VERIFIED: physical Android speaker output, pronunciation accuracy, real browser navigation or fluent-speaker approval. English speech remains explicitly an approximation.
- NEXT: Physical Android Test Sound / CH / A/Å / Reading Studio diagnostics; collect device/browser-specific results and fluent CHamoru review before authoritative audio labeling.


## 2026-10-26 09:58 Eastern | Stale phoneme timeout regression

- INSPECTED: public main at 040cddcf3e570a18de0d63a6b96b222d60730d66, actual Unit 0 phoneme player in index.html and existing seven simulated-audio regression cases.
- CODE UPDATED: added a test in scripts/test_phoneme_audio.js, commit 813865a60df58eb74f8de657c345daf294fd0e55. It confirms an older clip's delayed timeout cannot pause a newer clip, replace its status, or clear its active player.
- TESTED ONLY: executed the actual player source in an isolated JavaScript harness with fake Audio and timers; stale timeout resolved false, new clip completed true, both timers cleared, and no stale warning appeared. This is not a real Android, browser, speaker, or pronunciation test.
- CI/DEPLOY: GitHub connector returned no push workflow runs/status contexts for this new test commit; do not infer green CI or live deployment. The web reader could not retrieve the public site.
- NOT VERIFIED: physical Android Test Sound/CH/A/Å/Reading Studio playback, fluent CHamoru speaker approval, complete mobile lesson journeys. Existing storage keys, mastery, navigation and course content unchanged.
- NEXT: check CI when available; obtain physical Android audible observations and fluent-speaker review before approving pronunciation.


## 2026-10-26 10:44 Eastern | Superseded audio completion regression

- INSPECTED: current main phoneme player, eight behavioral regression cases, latest commit and GitHub Actions. Physical Android speaker output remains unverified.
- CODE UPDATED: `index.html` commit `98c24185a33fdcb4116c0b6945c3a2aad50c2045` now treats an `onended` event from a replaced clip as unsuccessful instead of advancing a stale playback. `scripts/test_phoneme_audio.js` commit `09cd541a0f7f58af597febc5556f8c6cf5aba3d9` adds a matching regression.
- TESTED: Pre-commit simulation confirmed older completion=false, newer completion=true, active player preserved, timers cleared and no stale warning. GitHub Actions audio regression run 40342955097 completed SUCCESS; Pages workflow 40342933022 completed SUCCESS for test commit. Workflow success is not an independently loaded site or audible phone test.
- PRESERVED: Local progress keys, rewards, mastery gates, course content, navigation, storybook, and fluent-speaker approval gate unchanged.
- NEXT: Physical Android Test Sound/CH/A/Å/Reading Studio observations in Chrome and in-app browser; review audio with a fluent CHamoru speaker before labeling authoritative.

## 2026-10-26 11:46 Eastern | Late audio rejection regression

- INSPECTED: public main commit a6ba591e6a7baae14fde8a74b715957edc834a4b, current phoneme player and nine prior regression cases, GitHub Actions and published-site reader. Site could not be independently loaded in the web reader.
- CODE UPDATED: `scripts/test_phoneme_audio.js` commit `57d026310e4fe99c96fdb8a515d5db655025a68e` adds a tenth simulated case: late rejected Audio.play from a superseded clip cannot overwrite status or interrupt the newer clip. No app UX, storage keys, mastery gates, course content or audio assets changed.
- TESTED ONLY: test source and fake Audio behavior reviewed; actual new CI workflow 40353099771 and Pages workflow 40353099821 were IN PROGRESS at first check. Do not call these passed until confirmed.
- NOT VERIFIED: audible physical Android playback, fluent CHamoru pronunciation, full real-device learning journeys or public website loading. Test Sound remains speaker-only, not pronunciation approval.
- NEXT: confirm new CI, collect real Android playback observations, then fluent-speaker review of CH/A/Å before publishing pronunciation as authoritative.

- CI FOLLOW-UP (same run): Phoneme audio regression run `40353099771` completed SUCCESS for commit `57d026310e4fe99c96fdb8a515d5db655025a68e`. The initial Pages run was cancelled by the newer audit commit; replacement Pages workflow `40353164853` completed SUCCESS for `5c87696f8019ed545457904f01b58f2b69288b45`. This is automated CI/deploy workflow evidence, not an independently opened website or audible Android confirmation.

### 2026-10-26 12:44 ET | Superseded phoneme playback
- CODE UPDATED: Starting another recorded phoneme now pauses and settles the prior clip immediately, rather than leaving overlapping audio active until an old timeout. No progress keys, lessons, or pronunciation assets changed.
- TESTED ONLY: In-memory fake-Audio behavior confirmed old promise resolves false, prior clip pauses, watchdog clears, and new clip finishes true; repository regression added. Physical Android audibility and fluent pronunciation remain UNVERIFIED.
