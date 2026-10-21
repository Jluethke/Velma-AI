# Android Google Play Release Checklist

**One-line description:** Takes a tested Android build to Google Play: bumps `versionCode`/`versionName`, checks the target API level requirement, merged-manifest exports and permission declarations, Data safety and sensitive-permission forms, builds and verifies a signed AAB, smoke-tests the minified build through bundletool, and runs an internal track then a staged production rollout with stop conditions tied to Android vitals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `matrix_run_report` (object, required): From `mob-device-os-matrix`.
- `android_crash_setup` (object, required): From `mob-android-crash-reporting`.
- `release_version` (string, required): `versionName` for this release.

---

## Outputs

- `android_release_checklist` (object): Each check with evidence, AAB path and signing certificate fingerprint, bundletool smoke results, track and rollout fractions, stop conditions.

---

## Phase 1: Version, Target SDK and Manifest

### Entry Criteria
- `matrix_run_report` has no open failures, or each has a written user decision.
- `android_crash_setup` shows a deobfuscated test crash.

### Actions
1. In `app/build.gradle(.kts)`: `versionName = "<release_version>"`, `versionCode` = previous + 1 (integer; must increase for every upload; Play's maximum is 2100000000). Flutter: `flutter build appbundle --build-name=<release_version> --build-number=<code>`; Expo: `eas build -p android` with remote versioning if configured.
2. Target API: Google Play requires new apps and updates to target a recent API level; read the current deadline on the Play Console Help page "Target API level requirements" and record the date checked. If `android_target_sdk` is below it, **Stop**: raising targetSdk changes behavior and needs its own testing (see `mob-device-os-matrix` rows).
3. Merged manifest audit (`./gradlew :app:processReleaseMainManifest`, then read `app/build/intermediates/merged_manifest/release/...`):
   - Every `<activity>`, `<service>`, `<receiver>` with an `<intent-filter>` has an explicit `android:exported` (required when targeting API 31+).
   - `android:debuggable` is absent or false.
   - Permissions match `mob-android-permissions`; sensitive ones (`ACCESS_BACKGROUND_LOCATION`, `QUERY_ALL_PACKAGES`, `MANAGE_EXTERNAL_STORAGE`, SMS/Call Log, `USE_EXACT_ALARM`, foreground service types) each need a Play Console declaration form.
4. Native libraries: if the app ships `.so` files, Play requires 16 KB page size support for apps targeting Android 15+ on its published schedule; check with `zipalign -c -P 16 -v 4 app-release.apk` (build-tools 35+) or Android Studio APK Analyzer, and read the current Play requirement page.

### Output
Version and manifest section.

### Quality Gate
- `grep -E "versionCode|versionName" app/build.gradle*` shows the new values.
- Merged manifest grep: `grep -c 'android:exported' <merged manifest>` equals the number of components with intent filters.

---

## Phase 2: Build, Sign and Verify the AAB

### Entry Criteria
- Phase 1 complete; upload keystore available outside git (environment variables or `keystore.properties` listed in `.gitignore`). Play App Signing enabled in Play Console.

### Actions
1. Build: `./gradlew :app:bundleRelease` (RN: `cd android && ./gradlew bundleRelease`). Output: `app/build/outputs/bundle/release/app-release.aab`.
2. Verify signature and certificate:
```bash
keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
```
   The SHA-256 fingerprint must equal the upload key fingerprint shown in Play Console > Setup > App signing.
3. Smoke-test the exact minified build on a device with bundletool:
```bash
java -jar bundletool.jar build-apks --bundle=app/build/outputs/bundle/release/app-release.aab --output=app.apks \
  --ks=<upload.jks> --ks-key-alias=<alias> --ks-pass=env:KS_PASS --connected-device
java -jar bundletool.jar install-apks --apks=app.apks
java -jar bundletool.jar dump manifest --bundle=app/build/outputs/bundle/release/app-release.aab | grep -E "versionCode|debuggable"
```
4. Smoke steps on the installed release: launch, sign in, each main screen, offline relaunch, a background job, a notification. R8 issues (missing keep rules for reflection/serialization) only show here: `ClassNotFoundException`, `NoSuchMethodException`, JSON fields null. Fix with targeted `-keep` rules or the library's documented consumer rules; do NOT disable minification.
5. Do NOT commit the keystore or passwords; check with `git status` and `git log -p -- '*.jks'` before release.

### Output
Verified AAB.

### Quality Gate
- `keytool` fingerprint equals the Play Console upload key fingerprint.
- `dump manifest` shows the new `versionCode` and no `debuggable="true"`.
- Each smoke step has pass/fail recorded with device and API level.

---

## Phase 3: Store Listing Forms and Staged Rollout

### Entry Criteria
- Phase 2 gates passed.

### Actions
1. Play Console > App content: Data safety form matches what the app and its SDKs collect (crash SDK sends crash logs and device identifiers; check each SDK's data disclosure page). Update sensitive permission declarations from Phase 1.
2. Upload the AAB to the internal testing track (Play Console, `fastlane supply --track internal`, or the Play Developer API). Install from the opt-in link on a device and repeat the smoke steps once.
3. Promote to production with a staged rollout. The rollout fractions are a user decision; record them (for example `fastlane supply --track production --rollout 0.1`).
4. Stop conditions: Android vitals defines bad-behavior thresholds for user-perceived crash rate and user-perceived ANR rate (overall and per device model); read the current values on the Android vitals documentation page and record them with the date. Add any stricter, user-chosen limit from the crash backend. If a limit is crossed, halt the rollout in Play Console (Production > Halt rollout).
5. Do NOT increase rollout while a stop condition is unresolved.

### Output
`android_release_checklist`.

### Quality Gate
- Internal track build number equals the new `versionCode` (Play Console or `fastlane supply` output).
- Stop conditions list each metric, its value, its source (vitals docs or user), and the date checked.

---

## Worked Example

Illustrative only. `release_version=2.4.0`, previous `versionCode` 56, `targetSdk 35`.

Phase 1: `versionCode = 57`; merged manifest: `OrdersDeepLinkActivity` missing `android:exported`, added `true` with a reason; `READ_EXTERNAL_STORAGE` from a library removed.

Phase 2:
```
$ keytool -printcert -jarfile app-release.aab | grep SHA256
         SHA256: 3A:9F:...:C4
$ java -jar bundletool.jar dump manifest --bundle=app-release.aab | grep versionCode
<manifest ... android:versionCode="57" android:versionName="2.4.0" ...>
```
Smoke: order detail crashed with `JsonDataException` under R8; added the Moshi codegen dependency the model needed instead of reflection; rebuilt; smoke passes.

Phase 3: internal track 57; production rollout fractions 10%, 50%, 100% chosen by the owner.

---

## Exit Criteria

DONE when version and target SDK meet the requirement, the merged manifest is clean, the signed AAB matches the upload key, the minified build passes smoke tests, forms are updated, and the staged rollout has recorded stop conditions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Play upload error "Version code N has already been used" | **Adjust**: raise `versionCode`. |
| Phase 2 | "Your Android App Bundle is signed with the wrong key" | **Stop**: you used a different keystore; find the registered upload key or request an upload key reset in Play Console. |
| Phase 2 | Release-only crash from R8 | **Adjust**: add a minimal keep rule for the class named in the stack trace; retest. |
| Phase 3 | Vitals threshold crossed during rollout | **Stop**: halt the rollout; open the top issue from the crash backend. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
