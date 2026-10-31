# CHamorU QA Audit


## 2026-10-29 07:45 ET | Clear stale sound-check prompt when switching recorded phrases

**CODE UPDATED + VERIFIED CI; GitHub Pages for this release pending at the time of audit. Physical Android audio and pronunciation still unverified.** Inspected main HEAD 13b8ff9 and the existing 14-phrase Family Voice Studio, IndexedDB cache, and 56-test suite before editing. Reproduced a real simulated UI race: while phrase B's Audio was waiting for \`onplaying\`, phrase A's previously visible "Yes I heard it" button remained clickable, allowing manual playback feedback to be attributed to the wrong phrase. This is device audibility feedback, never pronunciation mastery.

- **Fix:** PR [#1](https://github.com/clarenceandbridgettallen-ops/chamoru/pull/1) squash-merged as [002b86a](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/002b86a8774140e61ac1fa57c8e2f6da0401f117). \`voice-studio.js\` clears only the pending playback prompt and \`lastPlayedId\` before starting a different cached clip. Existing stored sound-check history, local recordings, IndexedDB keys, 14 phrases, XP/progress, reader, dialogue, Back/Next and privacy remain unchanged.
- **Regression:** \`scripts/test_voice_studio.js\` simulates delayed \`onplaying\`; asserts old prompt closes, stale confirmation cannot be stored, new phrase opens its own prompt, and only that phrase receives manual feedback. Before the fix, isolated V8 mocks reproduced the stale prompt. Patched isolated V8 preflight passed.
- **CI:** [PR workflow 40868140469](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40868140469) and [main workflow 40868237836](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40868237836) completed SUCCESS, **57 passed, 0 failed**. Raw main job log includes the new regression as test 57. Source and test readback on main verified.
- **Deployment:** [Pages workflow 40868236949](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40868236949) had not completed at this audit. Do not call this new fix live without deployment success and ideally independent served-source verification.
- **Remaining:** Consenting physical Android microphone Record → Stop & Save → audible Replay; private two-device JSON transfer; real browser codec/IndexedDB behavior; fluent CHamoru pronunciation and ambiguous legacy spelling review. No private audio uploaded and no paid tooling used.


## 2026-10-28 13:55 ET | Same-tab voice playback fix CI and Pages confirmed

**VERIFIED CI + SUCCESSFUL PAGES WORKFLOW; physical Android audio still unverified.** After source commit `714913e018fc71b6d86a1013b67ce4c28c6a0619`, test commit `49a77de0b94449160c128b7cbd8ae790385e69d0`, and prior audit commit `2974e780677487c6a22e1862c41a8672b52bf623`, read GitHub Actions runs and raw job logs:
- Learner/voice/phoneme QA [run 40739781515](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40739781515) completed **SUCCESS, 56 tests passed, 0 failed**. Raw log explicitly confirms new test `same-tab saved replacement and voice-pack import stop superseded audio before confirmation` passed as test 56.
- GitHub Pages [run 40739819701](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40739819701) completed **SUCCESS** for the audit HEAD, including build, deploy and report jobs. This proves the workflow, not independent live-browser HTML bytes, audio decoding or physical phone playback.
- No actual Android microphone, speaker, two-device transfer or fluent pronunciation tests; no private recording uploaded. Existing storage/progress keys and 14 phrases remain preserved.


## 2026-10-28 13:48 ET | Same-tab audio replacement and import race

**CODE UPDATED + SYNTHETIC PREFLIGHT TESTED; GitHub Actions and physical Android playback not yet verified.** Inspected public main, 14-phrase voice storage/playback source, 55-test history, and cross-tab playback protection before editing. Found a remaining local-tab race: replacing a clip through the public save API or importing a matching voice-pack entry could update the cached Blob while the previous Audio instance continued playing, permitting stale manual audibility feedback.

- **Fix:** `voice-studio.js` commit `714913e018fc71b6d86a1013b67ce4c28c6a0619` stops only the active superseded phrase on successful same-tab IndexedDB save or batch import transaction commit, before refreshing cache and invalidating old sound feedback. Unrelated playback is not interrupted. Existing IndexedDB keys, 14 phrases, voice-pack format, private consent, learner mastery and Next navigation unchanged.
- **Regression:** `scripts/test_voice_studio.js` commit `49a77de0b94449160c128b7cbd8ae790385e69d0` covers same-tab saved replacement, same-tab voice-pack import, stale playback confirmation, and replay of the imported replacement. Patched JavaScript syntax compiled successfully; 2/2 independent synthetic same-tab playback-stop preflight checks passed using a mocked browser/IndexedDB/Audio. The full GitHub Actions test suite is **pending verification**, not claimed passed.
- **Remaining:** Real Android mic permission, Record → Stop & Save → audible Play, consenting two-device export/import, actual browser storage races, and fluent-speaker review of disputed CHamoru pronunciations. No private recordings were uploaded, no paid browser tooling or deployment was triggered.


## 2026-10-28 03:41–03:43 ET | Stop stale cross-tab audio already playing

**CODE UPDATED + VERIFIED CI; physical Android audio remains unverified.** Inspected latest public main and 14-phrase Family Voice Studio, existing cross-tab cache refresh, source, test harness and QA history before editing. Found a source-level race: when another tab replaced or deleted a saved phrase, the receiving tab invalidated its cache but an existing Audio instance could keep playing the old Blob. A late `onplaying` event could offer a device-audibility confirmation for that superseded recording.

- **Fix:** `voice-studio.js` commit `9a0c66b0ee35c52557faac7f31855c9b55099c5e` tracks the active phrase and stops playback immediately on matching cross-tab replace/delete. Existing playback cleanup invalidates callbacks and clears the active phrase. Only phrase IDs cross BroadcastChannel; no audio, recordings or personal data are transmitted.
- **Regression:** `scripts/test_voice_studio.js` commit `20e547254ecdf6d8bafbb3d6e00f5cc7ac1b7746` tests a simulated second tab replacing and deleting a phrase during playback, verifies the old Audio is paused, stale sound confirmation closes, and the replacement can be replayed. This is synthetic VM audio, not physical listening.
- **CI:** GitHub Actions run https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40651754277 completed SUCCESS: **55 passed, 0 failed** (raw job log). Pages run https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40651754165 was still IN PROGRESS at this check; do not call the fix deployed until confirmed.
- **Preserved:** IndexedDB schema and keys, 14 phrases, private local voice pack consent/import/export, progress/XP, written mastery, dialogue, reader, Back/Next, and text-only fallback. No paid browser automation or private recording access.
- **Remaining:** Actual Samsung Record → Stop & Save → audible Play, two-device transfer, and fluent CHamoru pronunciation review. Browser GPU/Sites access is unrelated. Next verify Pages then physical Android flow with user consent.


## 2026-10-27 20:44 ET | Wait for IndexedDB read transaction commit (52-test CI)

**CODE UPDATED + VERIFIED CI. Actual Android microphone/audio and fluent pronunciation remain unverified.**

- Inspected main at `8951cbf8028c`, the 14-phrase Family Voice Studio, voice-cache warmup, recent aborted-read fix, and existing tests before editing. A request's `onsuccess` can fire **before** the containing IndexedDB transaction commits; `stored()` and `storedAll()` previously resolved at request success and could incorrectly report successful reads if the transaction then aborted.
- Atomic source/test commit [`cb8b9577bc00`](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/cb8b9577bc00b1dda59050bf64168e803aa26db0) now collects request results and resolves only on `tx.oncomplete`; `tx.onabort` and `tx.onerror` reject. The simulated IndexedDB harness now models read completion and a request-success-then-abort race. New regression checks that both read APIs reject and export reports the failure without changing saved clips. Existing phrase IDs, keys, Blob cache, consent, progress, XP and Next navigation were preserved.
- **Tests:** 4/4 narrow local Node transaction-ordering checks passed before commit. GitHub Actions [run 40610578985](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40610578985) completed **52 passed, 0 failed** across voice, phoneme and learner suites. GitHub Pages [run 40610578829](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40610578829) completed **SUCCESS** for the code commit. This proves workflow success, **not** physical Samsung audio, live-browser playback, two-device transfer or language pronunciation.
- **Next:** On a consenting real Android device, test microphone permission → Record → Stop & Save → Replay, then opt-in JSON export/import between two devices. Have a fluent CHamoru speaker approve pronunciation and disputed spellings before spoken proficiency claims. No private recordings uploaded or paid tools used.


## 2026-10-27 02:44 ET | Atomic family voice-pack import and CI

**CODE UPDATED + 45/45 AUTOMATED TESTS PASSED. Physical Android audio remains unverified.**

- Inspected current main and the v4.6 family-voice regression history before editing. A genuine data-integrity risk remained: importing a pack saved each clip in its own IndexedDB transaction, so a storage/quota error midway could replace some recordings while leaving others unchanged.
- `voice-studio.js` commit `e0d6363b4481` now validates/decodes each supported clip first and writes all valid clips in **one IndexedDB readwrite transaction**. Playback cache and local audibility confirmations change only after the transaction commits. Invalid clips continue to be skipped with an explicit count. Existing storage keys, voice-pack format, 14 phrase IDs, navigation, mastery, XP and rewards were preserved.
- Two isolated V8 preflight cases passed: (1) both clips commit on success; (2) a synthetic second-clip quota failure preserves the original recording and leaves the other clip absent. These tests use mocked IndexedDB and audio, not real phone storage or playback.
- Permanent simulated regression committed in `scripts/test_voice_studio.js` at `683e0b9000bd`; the initial CI run `40463035028` failed **one test-harness setup** because the new test omitted its fake `atob` decoder (44 passed, 1 failed). Test-only correction `6c2b02f21828` supplies that decoder. **Final GitHub Actions run [40463081279](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40463081279) completed SUCCESS: 45 tests passed, 0 failed**.
- GitHub Pages workflow for the final test-only commit was still running at this audit write; do not claim the newest deployment verified. No family recordings were exported, uploaded, played on real Android, or certified by a fluent speaker.
- NEXT: Confirm Pages workflow and independently test real Android Record → Stop & Save → Play, then opt-in export/import on two phones. Review pronunciation and legacy spellings with a fluent CHamoru speaker before language-audio mastery claims.


## 2026-10-26 | Family Voices in Conversations v4.6

**Outcome: CODE UPDATED + DEPLOYMENT VERIFIED + SIMULATED TESTS PASSED. Physical Android audio remains unverified.**

- **Release:** GitHub Pages served public page title `CHamorU · Family Voices in Conversations v4.6` and separate `voice-studio.js`. Public Actions deployment run [40428359379](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40428359379) succeeded for code commit `d1d54a737` (after module/test changes). New workflow run [40428358851](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40428358851) completed success. CI test workflow continues to run phoneme, voice-studio and Unit 2 randomized-recall suites.
- **Root cause addressed:** Previously, stored voices were retrieved through IndexedDB before each `Audio.play()`, risking loss of Android's tap user-activation window. `voice-studio.js` now preloads saved Blob clips on startup into a small in-memory cache; user click can synchronously create a local object URL and begin `Audio.play()` without awaiting storage. Saves/imports update the cache, deleting a clip removes it, and navigation stops old playback.
- **Lesson coverage:** `index.html` now uses saved family voices for guided/legacy dialogues, family quest and Reading Studio phrases. Unrecorded lines show a clear text-only explanation; no failed text-to-speech playback is represented as audible. Original lesson navigation, local progress, XP, mastery, reader bookmarks, all existing keys preserved.
- **Voice corpus:** Expanded from 8 to 14 existing lesson/dialogue expressions, with a mobile filter for Starter + Family (8) vs Conversations (6). Existing audio IDs were not renamed and voice-pack format remains backward-compatible. Legacy spellings such as `Si Yu’us ma’åse’` and `Buen probechu` are retained as distinct text pending fluent-speaker review; no silent spellings are merged.
- **User-confirmed playback check:** Voice Studio asks `Yes, I heard it` or `Still silent` after playback begins and stores a per-device technical result in `chamoru-device-audio-check-v1` localStorage. This does **not** establish verified pronunciation, listening proficiency or microphone functionality on a physical Android device. No audio is uploaded or sent to any external API.
- **Tests:** 17/17 isolated V8 behavioral tests passed against source as fetched from GitHub (13 voice-studio tests + 4 Unit 2 mastery tests). Verified synchronous start without IndexedDB await; cached vocabulary, dialogue/reader clip routing; missing-audio guidance; mic permission cancellation and stale-stream cleanup; local audibility-check persistence; mobile filters; 80% independent recall; one-time rewards and privacy assertions. These tests use fake IndexedDB, Audio and MediaRecorder and cannot verify sound actually reaching an Android speaker. Existing phoneme tests are included in GitHub Actions.
- **CI:** Both push and PR paths now trigger QA for `index.html`, `voice-studio.js`, the voice, family-word and phoneme regression tests. Workflow-only commit follows v4.6.
- **Remaining:** Require user-device Record → Stop & Save → Play → `Yes, I heard it` / `Still silent`. Validate JSON voice-pack export/import on two real phones. Confirm pronunciation and disputed written forms with fluent CHamoru reviewer. Unverified CHamoru TTS and isolated phonics must not be counted toward language mastery. Avoid replacing this version or repeating completed work.


## 2026-10-26 | Family Voice Studio v4.5 and randomized Unit 2 recall

- RELEASE: Public CHamorU GitHub Pages website returned title `CHamorU · Private Voice Studio v4.5`; separate `voice-studio.js` URL also responded. This verifies deployment of source assets, **not** physical microphone/audio playback.
- ADDED: `voice-studio.js` offline, private-by-default family audio recorder for 8 existing starter/family terms. Uses permission-gated MediaRecorder, browser IndexedDB blobs, replay, deletion with confirmation, and explicit voice-pack JSON export/import for consenting family use. No server API, paid dependencies, automatic uploading or unauthorized publication. Native speaker voice review remains a human step.
- INTEGRATED: `index.html` routes Unit 1 learning/practice audio buttons through saved family recordings first, with existing provisional voice sources only when no recording exists. Family Voice Studio is accessible from Practice & Explore, Voice settings, and the greeting lesson. Navigation contains Back and an always-visible NEXT.
- QUALITY: Unit 2 Family Words now shuffles question order and answer options per assessment attempt, counts only first submitted answers, requires 4/5 to pass, shows targeted meaning categories after all questions, and preserves old success/progress keys and one-time XP/shell rewards.
- SAFETY & POLISH: A recording microphone session is limited to 20 seconds, audio export is opt-in only, recording is guarded against accidental nav-away and page unloading, interruption errors do not falsely claim a saved clip, and larger packs can export. User-facing lesson text now says listening is optional while family/native recordings are prepared; the outdated 'No public launch' footer is removed.
- TESTS: 7/7 simulated voice-studio tests and 4/4 randomized family-word assessment tests passed in a V8 harness against exact repository source. Both test files were committed under `scripts/`, and audio-qa workflow was updated to invoke them alongside existing phoneme tests. The GitHub Actions result for these newest commits was **not** independently obtained; do not claim CI green based on the isolated tests.
- COMMITS: voice studio `d1e1c7e`, integration `718e399`, Unit 2 randomization `6a9ee00`, tests `dd882a8` and `4c70a61`, safety `2ee0833`, lesson polish `4ddc26f`. See GitHub commit history for latest audit/workflow commits.
- NOT VERIFIED: user-phone mic permissions, sound output from saved recordings or old MP3/TTS on Android, imported-file playback on a second device, and native CHamoru pronunciation. Existing English synthetic audio MUST remain provisional; never score language listening/speaking mastery based on it.
- NEXT: Test actual Android Record → Stop & Save → Play on CHamorU; verify export/import cross-device, then enlist a fluent speaker for accurate founder-approved audio and promote validated phrases into lessons. Keep the hourly build team investigating legacy silent TTS separately.


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


## 2026-10-26 13:45 ET | Guided phoneme sequence failure feedback
- **CODE UPDATED:** `index.html` commit `5129ddf3680a4b0b3b002330b30eba6eb2fb45da` stops a guided sequence when a recorded phoneme fails instead of overwriting its recovery guidance with a false `Finished` message. `scripts/test_phoneme_audio.js` commit `59e0aa3b1635614ddadbdd842a462de00c527958` adds two actual-sequence behavioral cases for failure and success.
- **VERIFIED AUTOMATED TESTS:** GitHub Actions audio regression run `40371972096` completed SUCCESS, with **13/13** Node tests passing. Pages workflow `40371973340` was PENDING/IN PROGRESS at last check. A CI success does not prove that the website loaded independently or that Android sound is audible.
- **PRESERVED:** Browser progress keys, mastery gates, rewards, course content, storybook, navigation and native-speaker review gate. No English TTS pronunciation was labeled authoritative.
- **NEXT:** Verify final Pages deployment; physical Android Test Sound/CH/A/Å and Reading Studio playback; obtain fluent CHamoru speaker approval before publishing pronunciation.


## 2026-10-26 14:44 Eastern | Live reachability and audio provenance
- **VERIFIED:** Independent public URL content fetch returned the CHamorU landing page title `CHamorU · Direct MP3 Greeting v4.2`, viewport metadata, and visible introductory text. This establishes successful HTML retrieval only, not an Android browser journey or speaker playback.
- **TESTED ONLY:** Parsed current `index.html` phoneme-audio mapping as JSON. It contains exactly **two embedded MP3 data URIs**, keys `ts` and `tsa`, both beginning with the `ID3` MP3 signature. Confirmed four navigation labels, sticky Next references, the legacy `chamoru_for_you_unit1_v15` storage key, and a fluent-speaker review warning remain present. A valid header is NOT a decoded audio test or pronunciation approval.
- **BLOCKED / NEXT:** Actual audible playback of Test Sound, CH, A/Å and Reading Studio requires a physical Android check. Embedded audio inventory is limited and must not be misrepresented as a reviewed full CHamoru phoneme library. No new vocabulary or pronunciation was published; fluent-speaker review gate remains mandatory.
- **FILES/DEPLOYMENT:** Audit-only update to `QA_AUDIT.md`; app code, progress and public assets unchanged. The fetched public page was reachable, but no new deployment was initiated.


## 2026-10-26 15:49 ET | Speaker diagnostic stale-callback protection

- **INSPECTED:** Current `index.html` speaker diagnostic and guided phoneme test harness; previous main `bc8f6bb` Pages run `40380569323` was SUCCESS. Android in-app sound remains a user-reported failure, not independently reproduced.
- **CODE UPDATED:** `index.html` commit `ea7ee157e23f995dd71b91bd1f323e16136b56c3` makes the Test Sound beep cancel its preceding oscillator and ignore obsolete completion, error, or delayed `AudioContext.resume()` callbacks after another sound action. No lesson progress keys, mastery, rewards, navigation, pronunciation recordings, or course data changed.
- **TESTED:** `scripts/test_phoneme_audio.js` commit `752799263f96fadde1b1adc94e9db29e9623269e` adds two synthetic speaker tests. An independent fake-oscillator harness passed four cases before commit. Final GitHub Actions audio workflow `40390190461` completed SUCCESS with **15 tests passed, 0 failed**. Pages workflow `40390190594` completed SUCCESS for the same commit.
- **NOT VERIFIED:** Audible beep or CH/A pronunciation on a real Android device, complete live mobile journey, fluent CHamoru review, or whether the phone's silent-audio issue is resolved. The Pages workflow is deployment evidence, not proof of audio playback.
- **NEXT:** Ask an authorized Android tester to tap Test Sound, CH, A/Å, record the exact on-screen diagnostic text and whether sound was heard; keep English-TTS approximations unapproved until fluent-speaker review.

## 2026-10-26 16:44 ET | English example TTS timeout and failure integrity

- Inspected latest public main, existing 15 fake-audio tests, prior successful Pages workflow, and the exact `u0AmericanUtter` / `u0SaySequence` implementations. English TTS previously waited indefinitely if no end/error event arrived and could falsely finish a guided sequence.
- **CODE UPDATED:** `index.html` commit `f54d9e4` adds a 7-second English-TTS watchdog, explicit unavailable/blocked/error messages, and prevents guided sequences from announcing success after failed English speech. `scripts/test_phoneme_audio.js` commit `a39e37f` adds four synthetic regression checks.
- **VERIFIED AUTOMATED TESTS:** GitHub Actions audio run `40398235304` completed SUCCESS, **19/19** tests passed. Pages build/deployment workflow `40398235642` completed SUCCESS for `a39e37f`.
- **NOT VERIFIED:** Actual Android audible playback, physical-device browser permissions, fluent CHamoru pronunciation, full user journey, or independent public-site retrieval. English speech remains an approximation, not authoritative CHamoru.
- No progress keys, rewards, mastery gates, curriculum content, four primary navigation tabs or Next controls were intentionally changed. Next: device listening and fluent-speaker audio review.


## 2026-10-26 17:47 ET | Android vowel voice constructor failure recovery

- **INSPECTED:** Current main source, 19 prior phoneme regression tests, actual A/Å symbol handler, latest GitHub Actions and public Pages workflow. The vowel button previously created `SpeechSynthesisUtterance('ah')` outside the guarded speak block, so an Android WebView constructor exception could escape without visible recovery.
- **CODE UPDATED:** `index.html` commit `ddf9f42bbeedeb0df295da8c4708d8de5746576c` catches a throwing speech constructor for A and Å and displays “Vowel voice unavailable. Try Test Sound or open in Chrome.” No pronunciation claims, new content, progress keys, rewards, mastery gates or navigation changes.
- **TESTED:** Isolated V8 execution of the actual updated symbol handler with a throwing constructor for both A and Å passed (2/2 user-visible recovery cases, no uncaught exception). `scripts/test_phoneme_audio.js` commit `f4d006f47ea61b2f6923182df27782ce95ac9328` adds a permanent Node VM regression. GitHub Actions audio regression run `40407355302` completed SUCCESS; Pages build/deployment workflow `40407356096` also completed SUCCESS.
- **NOT VERIFIED:** Actual audible Android sound, fluent CHamoru pronunciation, or independent public mobile-browser playback. GitHub deployment workflow success is not proof of physical sound or complete lesson journeys.
- **NEXT:** Have a real Android listener try Test Sound → CH → A/Å and capture which control audibly works. Replace unreviewed pronunciation only after fluent CHamoru speaker approval.


## 2026-10-26 18:49 ET | Android speaker AudioContext resume watchdog

- **INSPECTED:** Main source after 17:47 ET vowel recovery; Unit 0 `u0SoundTest` and existing 20 Node audio tests; public Pages workflow. The suspended AudioContext `resume()` promise had no timeout, so Android WebView could leave Test Sound stuck on "Starting speaker test" indefinitely.
- **CODE UPDATED:** `index.html` commit `5b609c2b1738e31cf98220db95bd96b8c7570207` adds a seven-second suspended-context watchdog, user-visible Chrome/volume recovery, closure of a stalled context, and late-resume suppression. Retrying creates a fresh AudioContext. Existing playback keys, navigation, mastery gates, rewards, lessons and pronunciation-review restrictions were not changed.
- **TESTED:** `scripts/test_phoneme_audio.js` commit `01284f4c08d98a7b3b1bdcce090ee1d9fe92a16a` adds timeout/late-resume and successful-resume regression tests. Isolated V8 simulation passed before commit; GitHub Actions `40415379001` completed SUCCESS with **22/22 Node tests**. GitHub Pages workflow `40415379036` completed SUCCESS on the same test commit.
- **NOT VERIFIED:** A physical Android beep, CH or A/Å audible playback, complete mobile browser journey, exact production HTML served at the Pages URL, or fluent CHamoru pronunciation. A public web reader could not retrieve the URL; that does not prove an outage. Computer/English sound remains unreviewed approximation.
- **NEXT:** Use a real Android listener for Test Sound → CH → A/Å, record which sound is actually heard, and require fluent-speaker approval before publishing authoritative phonics audio. Do not unlock new lessons on synthetic audio evidence alone.

## 2026-10-26 19:42 ET | Android microphone permission cancellation and race recovery

- **INSPECTED:** Public CHamorU main after v4.5 release, `voice-studio.js`, the real `scripts/test_voice_studio.js` harness, current `QA_AUDIT.md`, and GitHub Actions. This is an incremental fix, NOT a new Voice Studio build.
- **CODE UPDATED:** `voice-studio.js` commit `6667cb2210035201928aeb576bb6644ed78d4257` adds an explicit pending-microphone state with a **Cancel microphone request** control before recording starts. Each permission request gets a generation token; if a user cancels, navigates away, or starts a new request for the same word, a late permission grant closes its own stream instead of starting an outdated recorder. The normal **Stop & Save** control remains visible once recording starts. No browser progress keys, rewards, mastery gates, language content, approved audio or user clips were changed.
- **TESTED:** Isolated V8 execution of the updated real source passed 5 synthetic microphone-state checks (pending control, cancellation, late-stream release, same-word retry isolation, normal stop/track cleanup). `scripts/test_voice_studio.js` regression commit `a363d41a208e84ddbdf4126d634d9b3a9d6e0a68` adds permanent cancellation/retry coverage. GitHub Actions learner-flow run **40421594455 completed SUCCESS: 34/34 tests passed, 0 failed**, including the new permission race test (test #34).
- **DEPLOYMENT:** GitHub Pages run **40421594716** was still in progress at first check; previous run for intermediate commit was cancelled by the newer commit. Do not claim the updated source is live until Pages finishes and the actual public page is independently checked.
- **NOT VERIFIED:** Physical Android microphone prompt/cancellation, real Record → Stop & Save → Play, export/import across phones, actual speaker output, fluent pronunciation, or full mobile learner journey. Old TTS remains unreliable on Android; no unreviewed phonetics were promoted to authoritative audio. No recordings uploaded.
- **NEXT:** Verify Pages completion and authorized Android record/save/play test, then native-speaker review; preserve existing learning data and never infer audible success from simulated tests.

- **FOLLOW-UP PRESERVATION FIX:** `voice-studio.js` commit `331a3edfebf325e95db31f45c3a8bfefea42e73d` retains the prior best-effort Stop & Save on page exit when a recorder is already active, while invalidating only a pending microphone-permission request. JavaScript parsed successfully; final CI for this follow-up was pending at write. A page-exit save is never guaranteed by browsers, so users should explicitly tap Stop & Save before leaving.


## 2026-10-26 evening | MediaRecorder voice-pack codec import repair

- **INSPECTED:** HEAD b9634cc before this fix, existing v4.6 Family Voice Studio `voice-studio.js`, `scripts/test_voice_studio.js`, QA log, and the current public JS asset. Existing voice library, consent rules, progress keys and lesson routes were preserved.
- **VERIFIED DEFECT (SOURCE):** Recorder prefers `audio/webm;codecs=opus` and saves a Blob with that MIME. JSON export uses FileReader's data URL, but import previously accepted only `data:audio/webm;base64,...` without `codecs`. Thus a legitimate exported clip with a codec-qualified MIME could be silently skipped on a second device.
- **CODE UPDATED:** `voice-studio.js` commit `b561cfdc598f816bee6984b63df58ea27519d086` accepts allowlisted audio MIME types with optional constrained codec parameters, preserves codec metadata, and continues rejecting unrelated MIME parameters. `scripts/test_voice_studio.js` commit `c783af875f601d4d53c497d3c493f1b2c0c65405` adds a synthetic import test for WebM/Opus, MP4/AAC, legacy WebM, and rejected unsafe MIME values.
- **TESTED:** 6/6 precommit codec-MIME parsing cases passed in isolated V8. GitHub Actions learner-flow/audio QA run [40434197309](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40434197309) completed SUCCESS on `c783af8`, including the new Node regression. GitHub Pages run [40434197139](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40434197139) was still IN PROGRESS when checked; do not infer the new version is publicly deployed yet.
- **NOT VERIFIED:** Actual Android microphone or speaker, a real two-device export/import, decoded playback of imported clips, pronunciation accuracy, or a full real-browser learner journey. No family audio was uploaded or used in tests. Fluent CHamoru review remains mandatory.
- **NEXT:** Confirm Pages success, then consenting Android-to-Android Record → Stop & Save → Play → Export → Import → Play and honest heard/silent feedback. Never equate technical playback with spoken mastery.


## 2026-10-26 22:44 Eastern | Corrupt voice-pack entry recovery

- **INSPECTED:** Public HEAD `7f08ff7` and v4.6 Family Voice Studio with 14 phrase slots, local IndexedDB/Blob cache, manual heard/silent checks, and explicit private JSON transfer. Existing learning progress, rewards, navigation and pronunciation-review gate remain unchanged.
- **VERIFIED SOURCE DEFECT:** A voice-pack entry with an allowed audio MIME but malformed base64 can throw in `atob`, aborting the entire import and preventing valid later entries from loading. Prior importer also reported only the imported count, not that entries had been skipped. This is distinct from real Android playback failure.
- **CODE UPDATED:** `scripts/test_voice_studio.js` commit `2b5ac819` added the corrupt-then-valid import regression. `voice-studio.js` commit `ad4d5916` catches per-entry decode errors, skips malformed/unsupported clips, reports the skipped count, and reminds the learner to verify playback on the receiving device. No family audio or private recording was used in tests.
- **TESTED:** Isolated V8 execution of the actual modified import function passed a malformed-first, valid-second clip case, explicit skip feedback and file-input reset. GitHub Actions learner-flow run [40440344273](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40440344273) completed **SUCCESS: 42/42 tests, 0 failures**. The test-only intermediate commit initially failed before the code fix, as expected. The Pages workflow for the code commit [40440344352](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40440344352) was pending at the latest check, so live deployment is not yet confirmed.
- **NOT VERIFIED:** Actual Android microphone recording, speaker audibility, playback of imported clips on a second phone, full learner journey in a real browser, or fluent CHamoru pronunciation. Beep-only success does not validate spoken audio. No guessed phonetics or unauthorized uploads.
- **NEXT:** Confirm Pages success, then test real Android Record → Stop & Save → Play → Export → Import → Play with consenting family speaker and native-speaker review.


## 2026-10-26 23:41 ET | Late cache warmup privacy and replacement race

- **INSPECTED:** Current v4.6 `voice-studio.js`, 42-test voice/audio regression suite, prior QA evidence, and live GitHub Actions status for earlier commit `ad4d591`. Earlier QA run `40440344273` completed SUCCESS, and audit-only Pages run `40440587954` now reports all build/deploy jobs SUCCESS.
- **VERIFIED SOURCE DEFECT:** `warm()` reads a snapshot of IndexedDB recordings asynchronously. If a user replaces or deletes a clip before that old read resolves, the original warmup loop could reinsert the stale Blob into the in-memory playback cache. This could replay a deleted clip until page reload or replace a freshly saved one.
- **CODE UPDATED:** `voice-studio.js` commit `123ddecc9be52595f706717ee25513a3d36142bc` tracks IDs touched by a save/delete during this page session and refuses to hydrate those IDs from a stale warmup snapshot. It does not alter IndexedDB schema, saved progress, mastery gates, navigation, recordings, or export/import formats.
- **TESTED:** Two isolated V8 scenarios executed against the actual updated source: (1) a delayed old warmup after replacement must play the new Blob, and (2) a delayed old warmup after deletion must not resurrect playback. **2/2 passed.** Permanent Node regression added in `scripts/test_voice_studio.js` commit `4076b0c2078cf6b56f7eb7b314c6992b7aebf558`. Full GitHub Actions for these new commits and new Pages deployment were **not independently confirmed at audit time**; do not count this as CI success yet.
- **NOT VERIFIED:** Actual Android recording, audible playback, two-device transfer, native-speaker pronunciation, or full real-browser learner journey. No family audio was uploaded. Next: confirm CI/Pages on the latest code and test physical Record → Stop & Save → Play with consenting family speaker.


## 2026-10-27 early morning Eastern | Latest audio-cache CI and Pages confirmation

- **INSPECTED:** main HEAD `1861481f3a`, `voice-studio.js` cache warmup guard and `scripts/test_voice_studio.js` regression, previous QA audit, and current GitHub Actions jobs. The shipped v4.6 Family Voice Studio (14 local phrase slots), progress keys, one-time rewards, mastery gates, Back/Next and consent-only transfer remain unchanged.
- **VERIFIED AUTOMATED TESTS:** [Learner flow, voice and phoneme QA run 40446175770](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40446175770) completed **SUCCESS: 43 tests, 43 passed, 0 failed**, including the late cache-warmup replacement/deletion regression. This supersedes the previous `CI unverified` note for commits `123ddecc`/`4076b0c`.
- **VERIFIED DEPLOYMENT WORKFLOW:** [GitHub Pages run 40446270110](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40446270110) completed **SUCCESS** for HEAD `1861481f3a`. Independent read-only website retrieval was unavailable in this run; workflow success is not evidence of physical Android playback.
- **NOT VERIFIED:** Real Android microphone, audible saved-voice playback, cross-device voice-pack import/export, full interactive browser journey, or fluent-speaker pronunciation. Prior beep success does not prove spoken-word audio. No family recordings, guessed phonetics or paid services were used.
- **NEXT:** Consenting Android Record → Stop & Save → Play → Export → Import → Play test, followed by fluent-speaker review; preserve existing lessons and storage.

## 2026-10-27 01:44 ET | Duplicate family voice-pack safety regression

- **INSPECTED:** main before edits `15b1a183`, `voice-studio.js` import/export, the existing simulated voice-pack tests, and previous 43-pass learner CI. Public v4.6 remains reachable by independent read-only page extraction; this is not a live Android audio test.
- **CODE UPDATED:** commit `a103d0faa902adaff95fa1817d022f016e68bda0` rejects voice packs with duplicate *recognized* phrase IDs before asking permission or changing any recordings. Previously the second entry for the same phrase would silently overwrite the first entry within a single import. Invalid unrelated entries retain the existing skip-and-report behavior. Existing IndexedDB schema, progress keys, rewards, navigation, and explicit opt-in export/import are unchanged.
- **REGRESSION TEST:** commit `3d589874d0ab25c6d37defc561012c2079d96d49` adds a test asserting that a duplicate-containing pack neither overwrites an existing recording nor partially imports another phrase; input selection clears and the user receives an error. [GitHub Actions run 40457056682](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40457056682) completed **SUCCESS: 44 tests, 44 passed, 0 failed**, confirmed in the raw job log.
- **DEPLOYMENT LIMIT:** [Pages run 40457056392](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40457056392) was still waiting when checked; do not claim the duplicate-ID fix is live yet. The previously deployed v4.6 landing page was read-only retrieved. This audit-only commit may trigger another Pages run.
- **NOT VERIFIED:** Real Android microphone/recording playback, audio codec decoding, two-device voice-pack transfer, fluent CHamoru pronunciation, or complete interactive learner journey. No family recordings or paid tools used.
- **NEXT:** Confirm Pages for the code commit, then real-device Record → Stop & Save → Play and explicit two-device transfer with consenting family speaker; preserve honest sound checks and mastery gates.


## 2026-10-27 03:45–03:50 ET | Voice-pack transfer safety during microphone capture

- **INSPECTED:** Public main before edits `1c9039b`, v4.6 `voice-studio.js`, existing 45-test voice/learner QA, `QA_AUDIT.md`, and the current GitHub Actions runs. Previously completed atomic IndexedDB voice-pack import remains unchanged.
- **VERIFIED SOURCE DEFECT:** Voice-pack Import and Export controls remained active while a microphone permission request or recording was in progress. An import could replace the same phrase while an in-progress recording later saved over it; export could omit the still-unfinished recording without a clear warning.
- **CODE UPDATED:** `voice-studio.js` commit `4e08896a4e8c28853249b81240143245c11dc23a` blocks both transfers while `currentId` is active, explains the necessary Stop & Save / Cancel action, and clears a blocked import file selection. No change to recordings, IndexedDB schema, progress keys, mastery, rewards, navigation, voice-pack format, or consent requirements.
- **TESTED:** A direct isolated V8 before/after simulation reproduced the previous behavior (export attempted storage; import read the file) and verified the new guards (no import file read, clear selection, explanatory messages). Permanent Node regression commit `bf1487eb57f534ed76336e6769f552e711b34f7c`. GitHub Actions [run 40469221810](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40469221810) completed **SUCCESS: 46/46 tests, 0 failed**, confirmed in raw job logs. GitHub Pages [run 40469221628](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40469221628) completed SUCCESS; this verifies deployment workflow, not Android audio.
- **NOT VERIFIED:** Physical Android microphone, audible playback, two-device voice-pack transfer, fluent CHamoru pronunciation, complete real-browser journey, or deployed JS bytes. Independent read-only landing-page retrieval returned v4.6, but not the audio code's runtime behavior. No family audio uploaded or paid tools used.
- **NEXT:** Real Android Record → Stop & Save → Play, then consenting two-device import/export and fluent-speaker review. Preserve text-only fallback and independent mastery gates.

## 2026-10-27 04:46–04:51 ET | Local voice-save race protection

- **INSPECTED:** Current public repository main HEAD `ea880dcb`, latest `QA_AUDIT.md`, `voice-studio.js`, and existing 46-test learner/audio suite. Fresh read-only retrieval of the published landing page displayed v4.6. This does not verify physical audio.
- **VERIFIED SOURCE DEFECT:** MediaRecorder `onstop` cleared `currentId` before the asynchronous IndexedDB save committed. During that interval the app could start another recording or import/export a voice pack, potentially omitting the new clip from an export or racing its replacement during import.
- **CODE UPDATED:** Commit `51a5fd5b` adds `savingId` through the local write lifecycle. Record, Play, Delete, navigation, category switching and voice-pack transfers are guarded while the clip is saving; an explicit saving indicator is shown. A failed write clears the guard and reports failure. Existing IndexedDB keys, recordings, lesson progress, rewards, mastery gates, dialogue, and always-visible Next are preserved.
- **TESTED:** Six isolated V8 checks with a deliberately deferred synthetic IndexedDB commit passed, including blocked export/import/new capture and successful release after commit. Permanent regression commit `84b59304` adds a deferred-write test to `scripts/test_voice_studio.js`. [GitHub Actions 40476062104](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40476062104) completed SUCCESS; raw job log shows **47 tests, 47 passed, 0 failed**, including the new Stop & Save regression. No real browser/microphone/audio was involved.
- **DEPLOYMENT:** Pages run `40476062303` for `84b59304` was in progress at first inspection; do not call the new fix live until the workflow and deployed artifact are checked.
- **NOT VERIFIED:** Actual Android Record → Stop & Save → Play, audible family voice, cross-device JSON transfer, full learner journey, or fluent CHamoru pronunciation. No family audio was uploaded or paid browser automation used.
- **NEXT:** Confirm Pages completion; test real Android save/playback and explicit consenting two-device import/export. Obtain fluent-speaker review before spoken mastery claims.

## 2026-10-27 05:44–05:49 ET | In-flight family voice transfer serialization

- **INSPECTED:** Public main HEAD before edits `e982a565`, `voice-studio.js`, `scripts/test_voice_studio.js`, prior 47-pass audit, and current GitHub Actions. The v4.6 14-phrase local voice library, consent-only JSON pack, existing progress keys, independent mastery, rewards, and Back/Next remain unchanged.
- **SOURCE DEFECT:** Prior guards only checked `currentId` and `savingId` at the START of import/export. An asynchronous `file.text()`, IndexedDB read or FileReader encode left a window where a new recording or second transfer could start while the first transfer was still running. Deletion could also occur during export.
- **CODE UPDATED:** `voice-studio.js` commit `ee4c10f6` introduces a transient in-memory `transferBusy` guard held across the entire import/export operation and released in `finally`, including error/cancel/empty-export paths. It blocks new recording, concurrent transfer and deletion until the operation ends. No IndexedDB schema, stored recording, user data, or file format was changed.
- **REGRESSION TESTED:** `scripts/test_voice_studio.js` commit `a40192d2` adds two synthetic deferred import/export tests. Both passed in [GitHub Actions learner-flow QA 40483163310](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40483163310); raw job log reports **49 tests, 49 passed, 0 failed**. JavaScript syntax and exact replacement-anchor checks passed before commits. The earlier code-only CI also passed. [Pages run 40483163924](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40483163924) completed SUCCESS for the test commit. This confirms workflow completion, not actual Android audio or deployed byte identity.
- **NOT VERIFIED:** Real Android microphone/Record → Stop & Save → Play, audibility, second-device JSON import/export, fluent CHamoru pronunciation, or a full interactive browser journey. No private family recording was uploaded; no paid browser service was used.
- **NEXT:** Verify physical Android audio and consenting two-device transfer, then fluent-speaker review. Keep sound feedback distinct from pronunciation mastery.


## 2026-10-27 08:47–08:52 ET | Aborted local delete resolves safely
- **INSPECTED:** Existing public main HEAD ae01aa17 and v4.6 Family Voice Studio, QA_AUDIT.md, current Node regression suite, and actual IndexedDB deletion path. Previous 49/49 tests and Pages workflow successful. No family recording accessed.
- **SOURCE DEFECT:** `erase(id)` listened for IndexedDB transaction completion and error, but not `onabort`. An aborted transaction with no error event could leave its Promise unresolved and the delete UI waiting indefinitely, even though the recording remained intact.
- **CODE UPDATED:** `voice-studio.js` commit `3f225630` adds `tx.onabort` rejection for deletion. Existing successful deletion behavior, storage keys, cache, sound-check invalidation, learner progress, mastery, Back/Next, and voice-pack format are unchanged.
- **TESTED:** `scripts/test_voice_studio.js` commit `97c077e6` simulates an aborted IndexedDB delete, asserts the operation settles, original family audio remains, and the user sees a failure message. GitHub Actions [learner/audio run 40506828106](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40506828106) completed **SUCCESS: 50/50 tests, 0 failed** (confirmed in job logs). [Pages run 40506828347](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40506828347) completed SUCCESS for the tested commit; deployed JavaScript bytes and actual device interaction were not independently checked.
- **NOT VERIFIED:** Physical Android mic, Stop & Save, audible playback, two-device import/export, actual aborted browser transaction, or fluent CHamoru pronunciation. No family audio uploaded, no paid browser automation.
- **NEXT:** Physical consenting Android record/save/play and two-device voice transfer; fluent speaker review of ambiguous spellings. Preserve text-only fallback and honest mastery gates.


## 2026-10-27 18:44–18:55 ET | Aborted private voice read does not strand playback/export

- **INSPECTED:** Public main before change d59056cd5a5b0a27dee98d208657a5094f1efa8b, existing 50-test voice/learner suite, local-only 14-phrase Family Voice Studio and prior aborted-delete fix. No family recording was accessed.
- **SOURCE DEFECT:** The IndexedDB read helpers `stored(id)` and `storedAll()` only settled their Promises on request success/error. A read transaction aborted without either request callback could leave the initial cache warm-up, Studio list or voice-pack export waiting indefinitely. This is a code-level failure mode, not a reproduced physical Android storage failure.
- **CODE UPDATED:** `voice-studio.js` commit `59a27f001d9aacdc3f18ea3633afe98ec6065445` adds transaction error/abort rejection to both read helpers. Existing IndexedDB name/schema, private recordings, cache, playback, progress, Back/Next, consent and import/export format are preserved.
- **TEST ADDED:** `scripts/test_voice_studio.js` commit `13509d37536b065c501099bef010b0720ccc4a32` simulates aborted reads, verifies both reads settle and export reports a failure without modifying saved clips. Local isolated V8 simulation passed **4/4** read scenarios (single/all reads, normal/abort); both source and regression-test JavaScript parsed. Exact GitHub file SHA readback confirmed both changes.
- **NOT YET VERIFIED:** The full new GitHub Actions suite, Pages deployment for these commits, actual Android microphone/Stop & Save/audio decoding, cross-device import/export, fluent CHamoru pronunciation, and real-browser aborted IndexedDB behavior. The earlier 50/50 CI success is historical, not this commit's result.
- **NEXT:** Check fresh CI and Pages for `13509d3`; then consenting Android Record → Stop & Save → Play and two-device transfer with fluent-speaker review. Do not equate sound checks with pronunciation mastery.

## 2026-10-27 22:45 ET | Cross-tab private voice cache consistency
- **INSPECTED:** Public main before edits `88e9af5`, current `voice-studio.js`, 52-test learner/voice suite and prior v4.6 audit. No original storage keys, 14 phrase IDs, recordings, mastery, Back/Next or reader routing changed.
- **SOURCE DEFECT:** Each open CHamorU tab retained its own warmed Blob cache. Replacing or deleting a phrase in another tab could leave stale audio available on tap. A late in-flight warmup could also restore a stale snapshot.
- **CODE UPDATED:** Commit [`48a67b6`](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/48a67b60d0a89f8f27206ee20ec0fa886acef442) broadcasts ONLY changed phrase IDs after successful IndexedDB save/import/delete transactions. Receiving tabs invalidate those cached entries and local manual audibility checks, then asynchronously refresh from IndexedDB. A cache epoch rejects reads begun before an external change. No Blob, base64, voice pack, personal recording or private content is sent through BroadcastChannel.
- **TESTED:** Test commit [`dc78a39`](https://github.com/clarenceandbridgettallen-ops/chamoru/commit/dc78a39ea365c021c0b35f24e72927fc47dd7b31) adds two synthetic VM-tab/IndexedDB regressions: replacement/deletion and old pending warmup. GitHub Actions [run 40622926910](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40622926910) completed SUCCESS, raw logs **54/54 passed, 0 failed**. Source-only CI for prior code commit also succeeded.
- **DEPLOYMENT:** Pages workflow for test commit [40622926925](https://github.com/clarenceandbridgettallen-ops/chamoru/actions/runs/40622926925) was in progress at this audit. Do not claim deployed bytes or Android audio from CI.
- **LIMITS:** This fix covers same-origin tabs with BroadcastChannel support, not physical Android audio, background/browser termination, unsupported-browser fallback, two-device voice-pack import/export, or fluent CHamoru pronunciation. No real family audio uploaded or paid browser metering.
- **NEXT:** Confirm Pages completion, then consenting Android Record → Stop & Save → Play and two-device voice-pack transfer, plus fluent-speaker review before spoken mastery claims.


## 2026-10-30 23:44 ET | v4.7 Culture & Audio Library source-only preservation check

- **READ FIRST:** `MEDIA_RECOVERY_REPORT.md` and this audit before inspection. Current public `index.html` blob `ee8fdc2d2d91ce181ad09a74f42f1431adb81b55`; recent recovery report commit `b5face8d`. The original v0.3/v0.4 ZIPs and 55.6 MB WAV remain unrecovered and are NOT production voice assets.
- **TESTED ONLY:** Eleven direct source assertions passed (11/11): v4.7 Culture & Audio Library title, seven attributed external references, no iframe/video or fetch/reward writes within the hub, Back/Next, existing learner storage key, games, reader, and voice-studio script reference. No learner data or media copied. This is **static inspection, not a browser or audio test**.
- **BLOCKED:** Runtime DNS and web URL access failed, so deployed Pages bytes and Android microphone/word audibility were not tested. The user's audible beep but silent spoken words remains unresolved. No native approved CHamoru speech dataset, fluent pronunciation certification, or licensed source-extraction permission is established. Do not require optional family recording as a prerequisite to an original app voice.
- **NEXT:** Design an original commercially permitted synthesis pipeline with documented CHamoru phonology, real waveform/signal-energy and codec checks, and fluent-speaker approval before sound mastery; expand unique independent written curriculum beyond the four repeated starter words. Preserve v4.7 discovery, games, dialogue, reading, rewards and mastery gates. No app source changes this execution. Five-project durable audit: private Factory HQ `9a40752c75e675aef322904db73c6a76ba456d2a`.


## 2026-10-31 00:44 ET | Offline original-voice signal gate, not a pronunciation claim

**READ FIRST:** Reviewed `MEDIA_RECOVERY_REPORT.md`, `QA_AUDIT.md`, current v4.7 index, latest commits and Pages before modifying anything. Public index blob `ee8fdc2d2d91ce181ad09a74f42f1431adb81b55` passed 12/12 preservation assertions: Culture & Audio Library, publisher discovery, games, reader, guided path, voice script and Next. Pages run `41165881071` succeeded on prior audit HEAD `d0355818`; served HTML and phone audio could not be independently fetched.

**CODE UPDATED / LOCAL TESTED:** Added `scripts/check_voice_wav.py` (`c1edd92c2279197eab2a349c1b33f5f18cad5ceb`) and `scripts/test_check_voice_wav.py` (`b70941f0334031c067cf405e645c20b1a4592a8f`). Python-standard-library, read-only, offline 16-bit PCM WAV analysis computes RMS dBFS, peak, 100ms silent-window fraction, clipping and DC offset, rejecting mostly silent or clipped experiments without printing private filenames or bytes. Tested 11/11 synthetic cases (silence, near-silence, clipping, DC offset, stereo, invalid sample rate, truncation, privacy/CLI), Python compile passed. Exact GitHub blob SHAs matched tested local files: `75b77376f787233a8f270608f5781525f4942a39` and `27362f7b66acc8bd46cd745dcc8d407466f3b004`. Both commits used [skip ci] to avoid starting potentially metered jobs.

**NOT VERIFIED:** This does NOT generate CHamoru speech, certify words, confirm Android decoding/playback, license third-party sources or validate any fluent pronunciation. No original WAV/ZIP was recovered; no family recording required, no third-party media copied, no learner state changed. Next: develop a rights-cleared original synthesis prototype with real measured waveform, then obtain fluent-speaker review and physical Android audibility confirmation. Expand unique written curriculum separately without bypassing mastery.

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


## 2026-10-31 03:44 ET | Sourced greetings recall draft, NOT learner release

**CODE UPDATED + 6/6 LOCAL NODE CHECKS PASSED; DEPLOYMENT/FLUENT REVIEW UNVERIFIED.** Read MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md before edits; inspected latest public index and Pages history. Current index blob before this change: `ee8fdc2d2d91ce181ad09a74f42f1431adb81b55`; no learner UI, sound playback, progress, gates, reader or Culture & Audio Library files were modified.

- Added `curriculum/drafts/greetings_recall_v1.json` (commit `27b021432a46c439b451a5557160aaba08c3216b`, blob `0bc62d0769d86bbf2fac7eff346d9c9ab2ca618f`): 16 distinct short greeting/interaction phrase-meaning pairs drawn from the Guam Visitors Bureau's two attributed public language pages. New independent exercise progression specifies meaning recognition, typed English meaning and typed CHamoru recall. This is a **non-live, non-graded review draft**, not extracted third-party media or a verified curriculum release. Exact spellings, variants, usage, registers and translations require fluent CHamoru review against Kumisión orthography.
- Added `scripts/test_draft_greetings.js` (commit `7ffa372a87b40c74afdf6b2bddb56e621f6f1f33`, blob `99be338fc2bd6ec8bb78244b29f1ad7edc070af0`). **6/6 offline Node assertions passed** on the corresponding locally created draft: review lock, 16 unique pairs, source attribution, written recall types, feature preservation and no audio/mastery override. Both GitHub file contents were confirmed equal to the submitted content by readback. No CI was triggered deliberately; no phone/browser tests were performed.
- Fresh measurement of the *earlier* unreviewed local eSpeak WAV: 2.051 seconds, 22,050 Hz mono, peak 0.902 full-scale, 0% clipped samples; final ~0.559 seconds (~27.3%) are below -46 dBFS. This is a timing/signal finding, **not evidence of authentic pronunciation or audible Android playback**. The experimental audio was not committed or published. Previous GPL/voice rights uncertainty remains.
- Previous Pages run `41178070747` succeeded for audit-only HEAD `fd19b432` at 2026-10-31 06:48 UTC, **before** these new draft commits. No claim that the draft is served, playable, reviewed, or integrated.

**NEXT:** Fluent CHamoru reviewer approves/edits draft spellings and meanings; implement gated written recall only after review; separately investigate a legally redistributable CHamoru-specific synthesis engine and test actual Android sound with consent. Never substitute an English phonetic approximation for a certified CHamoru voice.


## 2026-10-31 04:44 ET | Offline written-recall preview engine, NOT LIVE

**CODE UPDATED + TESTED ONLY.** Before modifying, read MEDIA_RECOVERY_REPORT.md and this QA audit, inspected main HEAD, the unapproved 16-phrase greetings draft, and the latest Pages workflow. Source and learner UI were preserved. No fluent approval, new published lesson, recorded voice, private audio upload, Android playback, or student progress change.

- Added `scripts/draft_recall_preview.js` in commit `5ae68343dc01de858547e74de53ece4905318822` and `scripts/test_draft_recall_preview.js` in commit `2b8d3810b9af2530fb48bec79acb86fda640beb0`, both [skip ci]. Existing draft `curriculum/drafts/greetings_recall_v1.json` is unchanged and explicitly unapproved.
- Preview deterministically shuffles the 16 reviewed-as-draft phrase pairs into 48 written prompts: 16 four-choice meaning recognition, 16 typed English meanings and 16 typed CHamoru recalls. It refuses duplicate or ambiguous meanings, invalid seeds, missing source references and any draft marked approved or claiming spoken approval. It has no scoring, answer-key fields, browser storage, audio, network or app imports.
- **Fresh tests:** local Node test runner 7/7 passed, CLI `--review-only` emitted 48 questions and `graded:false` / `progress_written:false`; invoking without the flag returned exit code 2. Exact GitHub source/test blob SHAs `9473209e8283f2942a7a37072231cc49edbc899e` and `911d743db9cb85619c9c986f7da8e89e82bf0b7e` match the locally tested files. Additional 7/7 isolated assertions passed against the exact GitHub draft and source. This is **not** browser, Android, linguistic or curriculum approval.
- Latest inspected Pages workflow `41182226977` succeeded at HEAD `f0591931fb7b553f7e26c38a2964b69c4c334eac` **before** these new code commits. No claim that new preview is deployed or usable by learners. Old games, rewards, culture links, voice recordings and progress remain untouched.
- **NEXT:** fluent reviewer confirms exact phrases, register, spelling and meaning before any gated live lessons; continue rights-cleared original CHamoru synthesis with signal, intelligibility and physical Android tests. Historical ZIPs and old WAV remain unrecovered. Never equate a beep or signal metric with spoken CHamoru accuracy.


## 2026-10-31 05:44 ET | Fluent-review handoff packet, NOT curriculum or speech approval

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md read before changes. Main HEAD before changes 850753da79d753f5dbb307545d1091b10ff347ab. The existing 16-phrase draft, 48-question preview, v4.7 seven-link Culture & Audio Library, games, reader, saved progress, mastery gates, local voice data and Back/Next were not changed.

**CODE UPDATED + LOCAL TESTED:** Added `scripts/build_fluent_review_packet.js` commit `900db527db7541bb96f6340a4633da1bf6aeb6b3` (Git blob `0279494d7efdb0f06ac93593c32fa2ea6a774553`) and `scripts/test_build_fluent_review_packet.js` commit `fbc4cb7a4ebc2a42ff4ed07a16b19d7c663a997d` (Git blob `feabff967a53d44ef1e5221b2aed2786ddef59b0`). Both committed blobs match exact locally tested files. Seven of seven local Node tests PASS, plus the CLI refuses use without explicit `--review-only` (exit 2). A locally reconstructed 16-entry draft fixture produced 16 pending pronunciation/meaning/spelling reviews and flagged one incomplete response template (`Na'an hu si` / “my name is...”) for contextual review. The fixture matches the known phrase pairs but is NOT an authenticated runtime read of the deployed learner app.

**SAFETY:** This is an offline, read-only reviewer packet. It rejects any draft claiming publish or pronunciation approval, requires HTTPS attribution, detects duplicate phrases, never marks reviews complete and does not access network, learner grades, browser storage or audio. No app assets, recordings or source media were published. New code uses [skip ci] to avoid potentially metered GitHub Actions; exact-HEAD CI, served bytes, Android audio, fluent pronunciation and license clearance remain unverified.

**RESEARCH NOTE:** eSpeak NG's official repository states GPL-3.0-or-later for the engine; Piper runtime and individual model/data licenses must be evaluated separately. Neither an experimental waveform nor a permissive repository tag alone grants approval for a commercially distributed CHamoru voice. Do not publish the English-phonetic placeholder.

**NEXT:** Give the review-only 16-entry packet to a qualified fluent reviewer, resolve incomplete-template/spelling/meaning/register questions, then independently validate a rights-cleared original CHamoru phonology-based voice on actual Android hardware before releasing spoken lessons.


## 2026-10-31 09:44 ET | v4.7 visible-version alignment (CODE UPDATED; deployment pending)

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md were inspected before the change; source main was 1cf17bca46ed046374d79d161cedb77774fd382d. Founder-approved v4.7 seven-link Culture & Audio Library, games, reading preview, learner storage, mastery gates, saved progress, rewards and navigation remain intact.

**VERIFIED SOURCE CHANGE:** The public index had an inconsistent hero pill 'MASTERY JOURNEY · v4.6' although its title was already v4.7. Changed ONLY that one literal to 'MASTERY JOURNEY · v4.7' in commit fc440afbf57e9953d5e0e5bf212ec7a208beb714 ([skip ci]); original index blob ee8fdc2d2d91ce181ad09a74f42f1431adb81b55, new blob bac1d1ca010625ebf6cafec4d37562cf865ea7c4. In-memory pre-write checks proved exact single-label substitution, unchanged byte count, and preserved storage/reader/games/mastery/navigation markers. GitHub readback verified the new label, all seven externally attributed source URLs, five existing navigation markers and the original storage key. This is a text consistency fix, NOT a new lesson or original voice.

**DEPLOYMENT:** GitHub Pages run 41206891744 for the new commit was IN PROGRESS when inspected. No claim of live served bytes, phone/browser UI or audio. Latest prior Pages run 41190126227 for older 1cf17bca succeeded. No third-party recordings/videos copied or published.

**FRESH OFFLINE AUDIO RECHECK:** Existing *unreviewed* 2.051-second, 22,050-Hz mono English-eSpeak WAV measured -16.43 dBFS RMS, 0.902 peak, zero clipped samples and ~0.559 seconds of trailing samples below -46 dBFS. It is not CHamoru pronunciation evidence or cleared for redistribution. Original v0.3/v0.4 ZIPs and 55.6-MB mostly-silent historical WAV remain unrecovered.

**NEXT:** Verify Pages completion/served bytes; qualified fluent review of 16 written phrases; develop original rights-cleared CHamoru synthesis and validate real Android playback/listener intelligibility before activating audio. No private family recording or learner data accessed. No paid service or browser charge.


## 2026-10-31 10:44 ET | Draft safety and Pages outcome

**READ FIRST:** Reviewed MEDIA_RECOVERY_REPORT.md and this QA_AUDIT.md before current checks. Main HEAD before audit 0a27beb2e6e377e29929f39aaafdfd64d178f4c3. Current index blob bac1d1ca010625ebf6cafec4d37562cf865ea7c4 retains Culture & Audio Library v4.7; no learner UI, progress, mastery, culture discovery, reader, games or audio changes made this pass.

**TESTED ONLY:** Exact current curriculum/drafts/greetings_recall_v1.json blob 0bc62d0769d86bbf2fac7eff346d9c9ab2ca618f passed 7/7 independent data checks: draft remains nonpublishable, no approved audio/pronunciation, 16 normalized-unique CHamoru entries, valid source keys, no phrase-level media URLs, preserved progress/mastery/culture flags, and three written recall modes. Incomplete template 'Na'an hu si' remains pending fluent review. These are static draft safety assertions, NOT fluent-language or spoken-word tests.

**DEPLOYMENT EVIDENCE:** GitHub Pages run 41206958406 completed SUCCESS for prior main HEAD 0a27beb2e6e377e29929f39aaafdfd64d178f4c3; build/deploy/report jobs succeeded. The earlier code-only run 41206891744 was CANCELLED by the later workflow. No independent served-byte read or actual Android audio listening was possible in this runtime. No new app media published. Historical v0.3/v0.4 ZIPs and old 55.6 MB WAV remain unrecovered.

**NEXT:** Fluent orthography/usage review of 16 draft entries, original commercially permitted synthesized CHamoru voice candidate, measurable signal/codec verification and real Android audibility before pronunciation approval. No external recordings copied or licensed by assumption.


## 2026-10-31 11:44 ET | Original voice engine licensing candidate (RESEARCH ONLY)

**READ FIRST:** MEDIA_RECOVERY_REPORT.md and QA_AUDIT.md reviewed before this entry. Public index.html blob bac1d1ca010625ebf6cafec4d37562cf865ea7c4 unchanged; v4.7 seven-source discovery, reader, games, Back/Next, saved progress, mastery and Family Voice Studio preserved. Latest Pages run 41211549937 completed SUCCESS on prior HEAD 308d762d; actual served bytes and Android word playback not independently tested.

**NEW SOURCE-VERIFIED RESEARCH LEAD, NOT IMPLEMENTATION:** Official upstream model card https://huggingface.co/hexgrad/Kokoro-82M lists Kokoro-82M open weights as Apache-2.0 and 82 million parameters, with preset voices in eight languages, **not CHamoru**. It may be a free local neural waveform backend to evaluate, unlike relying on device TTS, but model-card licensing alone does not clear all runtime dependencies, phonemizers, voice packs, output provenance or commercial distribution obligations. No weights downloaded, runtime executed, sound produced, speaker cloned, CHamoru phoneme mapping approved or Android audio tested in this run. No trial, API bill or third-party recording used. Do not substitute preset English/Spanish voices for an authentic CHamoru voice.

**NEXT GATE:** Document verified official orthography-to-phoneme rules, select a fully rights-audited local backend/voice pack, produce *original* experimental PCM, measure real speech signal and codecs, and obtain fluent-speaker pronunciation/intelligibility review plus actual Android playback before learner use. Prior English eSpeak candidate remains unapproved; Oct 11 v0.3/v0.4 ZIPs and mostly-silent 55.6 MB WAV remain unrecovered.
