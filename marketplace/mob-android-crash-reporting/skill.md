# Android Crash Reporting and R8 Deobfuscation

**One-line description:** Wires Firebase Crashlytics or Sentry into an Android app (native, React Native or Flutter), uploads R8 `mapping.txt` and native symbols for every release build, verifies with `retrace` and a forced crash on a minified build, and confirms ANR capture and Play Console Android vitals deobfuscation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `crash_backend` (string, required): `crashlytics` or `sentry`; other values **Stop**.

---

## Outputs

- `android_crash_setup` (object): SDK and plugin versions, mapping upload task names, native symbol upload setting, retrace evidence, test crash link with deobfuscated top frame, ANR capture confirmation.

---

## Phase 1: Install and Initialize

### Entry Criteria
- `app_profile.stack` is `android`, `react-native` or `flutter`.
- No other crash SDK in `app_profile.libraries.crash`; otherwise **Stop** and ask.

### Actions
1. By stack:

| Stack | Crashlytics | Sentry |
|---|---|---|
| android | Plugins `com.google.gms.google-services` and `com.google.firebase.crashlytics`; dependency `com.google.firebase:firebase-crashlytics` via the Firebase BoM; `app/google-services.json` | Plugin `io.sentry.android.gradle`; `io.sentry:sentry-android`; DSN in `AndroidManifest.xml` `io.sentry.dsn` meta-data or `SentryAndroid.init` |
| react-native | `@react-native-firebase/crashlytics` (Android Gradle plugin lines per its docs) | `npx @sentry/wizard@latest -i reactNative` (adds `sentry.gradle`) |
| flutter | `flutterfire configure`, `firebase_crashlytics` | `sentry_flutter` |

2. Crashlytics initializes automatically through a ContentProvider; Sentry auto-init also uses one unless disabled. Do not add a second manual init.
3. Opt-in: Crashlytics `firebase_crashlytics_collection_enabled` meta-data `false` in the manifest, then `FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(true)` after consent.

### Output
SDK installed.

### Quality Gate
- `./gradlew :app:assembleRelease` exits 0.
- `./gradlew :app:dependencies --configuration releaseRuntimeClasspath | grep -cE "firebase-crashlytics|sentry-android"` shows only the chosen vendor.

---

## Phase 2: Mapping and Native Symbols

### Entry Criteria
- Release build type has `isMinifyEnabled = true` (if not, mapping files do not exist; record it and skip to native symbols).

### Actions
1. R8 writes `app/build/outputs/mapping/release/mapping.txt`. Each release build has a unique mapping; keep it with the release artifacts.
2. Upload:

| Backend | Setting / task |
|---|---|
| Crashlytics | `firebaseCrashlytics { mappingFileUploadEnabled = true }` (default true for minified builds); the task `uploadCrashlyticsMappingFileRelease` runs with `assembleRelease`/`bundleRelease` |
| Crashlytics NDK | `firebase-crashlytics-ndk` dependency and `firebaseCrashlytics { nativeSymbolUploadEnabled = true }`, then `./gradlew app:assembleRelease app:uploadCrashlyticsSymbolFileRelease` |
| Sentry | `sentry { autoUploadProguardMapping = true; uploadNativeSymbols = true }` in the plugin block (options vary by plugin version; check its docs) |

3. Flutter: `flutter build appbundle --obfuscate --split-debug-info=build/symbols`, then `firebase crashlytics:symbols:upload --app=<FIREBASE_APP_ID> build/symbols` or the Sentry Dart plugin.
4. React Native: Hermes bytecode needs source maps; Sentry's gradle integration uploads them; check docs for Crashlytics JS error handling.
5. Play Console: when uploading an AAB built by AGP, the R8 mapping is included in the bundle metadata and Android vitals deobfuscates automatically; confirm in Play Console > App bundle explorer > Downloads ("ReTrace mapping file"). If missing, upload `mapping.txt` there.
6. Keep R8 rules from crash SDKs: they ship consumer ProGuard rules; do not add `-dontobfuscate` to get readable traces.

### Output
Mapping and symbol upload configured.

### Quality Gate
- `./gradlew :app:bundleRelease --dry-run | grep -i "uploadCrashlyticsMappingFile\|uploadSentryProguardMappings"` lists the upload task (task names vary by plugin version; record the actual name).
- `app/build/outputs/mapping/release/mapping.txt` exists after the build.

---

## Phase 3: Verify Deobfuscated Crash and ANR Capture

### Entry Criteria
- Phase 2 gates passed.

### Actions
1. Local check with R8 retrace (Android SDK `cmdline-tools/latest/bin/retrace`):
```bash
adb logcat -d -b crash > crash.txt
retrace app/build/outputs/mapping/release/mapping.txt crash.txt
```
   The retraced output must show your class and method names.
2. Forced crash on the minified release build (signed with a debug or upload key, installed with `adb install` or bundletool): trigger `throw RuntimeException("Test Crash")` from a debug-menu entry guarded by a build flag. Relaunch the app; reports send on next start. Debug logs: `adb shell setprop log.tag.FirebaseCrashlytics DEBUG` then `adb logcat -s FirebaseCrashlytics`.
3. Confirm in the console that the stack shows original names (for example `com.shop.orders.OrdersViewModel.debugCrash`).
4. ANR: Crashlytics reports ANRs on Android 11+ (via `ApplicationExitInfo`); Sentry has ANR detection enabled by default. To test on a debug device: block the main thread (`Thread.sleep` inside a debug-only click handler, never shipped) until the system ANR dialog appears, then relaunch.
5. Record a non-fatal (`FirebaseCrashlytics.getInstance().recordException(e)` / `Sentry.captureException(e)`) and confirm it appears.

### Output
`android_crash_setup`.

### Quality Gate
- `retrace` output contains the original class name of the crashing method.
- Console shows the test crash deobfuscated, the non-fatal, and (if tested) the ANR, each with a link or screenshot recorded.

---

## Worked Example

Illustrative only. Native Compose app, Crashlytics, AGP 8.7, minify on.

Phase 2: `bundleRelease --dry-run` lists `:app:uploadCrashlyticsMappingFileRelease`.

Phase 3:
```
$ retrace app/build/outputs/mapping/release/mapping.txt crash.txt
java.lang.RuntimeException: Test Crash
    at com.shop.orders.OrdersViewModel.debugCrash(OrdersViewModel.kt:142)
```
Console issue top frame `OrdersViewModel.kt line 142`; Play Console shows the mapping file under the release's downloads.

---

## Exit Criteria

DONE when one crash SDK is active, every minified release uploads its mapping (and native/Dart symbols where present), retrace and the console both show original names for a forced crash, and non-fatal and ANR capture are confirmed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `File google-services.json is missing` | **Adjust**: download from Firebase console for the exact `applicationId` (including debug suffix if used). |
| Phase 2 | Mapping upload task absent | **Adjust**: plugin applied to the wrong module or minify off; apply on `:app`. |
| Phase 3 | Console shows `a.b.c` names | **Adjust**: mapping for that build's version code missing; rebuild with upload or upload manually. |
| Phase 3 | Crash never appears | **Adjust**: relaunch the app after the crash; check collection is enabled. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
