# iOS Crash Reporting and dSYM Symbolication

**One-line description:** Wires Firebase Crashlytics or Sentry into an iOS app (native, React Native or Flutter), makes Release builds produce dSYMs and upload them automatically, proves symbolication by matching dSYM UUIDs and forcing a test crash outside the debugger, and lists the privacy manifest and opt-in settings the SDK needs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `crash_backend` (string, required): `crashlytics` or `sentry`. Other values: **Stop** and ask; the steps differ per vendor.

---

## Outputs

- `ios_crash_setup` (object): SDK and version, init location, dSYM upload method, UUID match evidence, test crash link and symbolicated top frame, privacy settings.

---

## Phase 1: Install and Initialize

### Entry Criteria
- `app_profile.stack` is `ios`, `react-native` or `flutter`.
- If `app_profile.libraries.crash` already has a different SDK, **Stop** and ask: two crash SDKs compete for the signal handlers.

### Actions
1. By stack and backend:

| Stack | Crashlytics | Sentry |
|---|---|---|
| ios | SPM `https://github.com/firebase/firebase-ios-sdk`, products `FirebaseCrashlytics` (+ `FirebaseAnalytics` optional); add `GoogleService-Info.plist`; `FirebaseApp.configure()` in `application(_:didFinishLaunchingWithOptions:)` or the `App` init | SPM `https://github.com/getsentry/sentry-cocoa`; `SentrySDK.start { $0.dsn = "<dsn>" }` at launch |
| react-native | `@react-native-firebase/app` + `@react-native-firebase/crashlytics`, then `cd ios && pod install` | `npx @sentry/wizard@latest -i reactNative` |
| flutter | `flutterfire configure`, `firebase_crashlytics`; set `FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError` and `PlatformDispatcher.instance.onError` | `sentry_flutter` with `SentryFlutter.init` |

2. Initialize as early as possible, once. Do not wrap init in a feature flag that defaults off.
3. User consent: if the app needs opt-in, set `FirebaseCrashlyticsCollectionEnabled` = `NO` in `Info.plist` and call `Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(true)` after consent (Crashlytics); for Sentry, start the SDK only after consent.

### Output
SDK installed and initialized.

### Quality Gate
- `app_profile.build_cmd` exits 0.
- Exactly one crash SDK appears in `Package.resolved`/`Podfile.lock`.

---

## Phase 2: dSYM Generation and Upload

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. Build setting: `DEBUG_INFORMATION_FORMAT = dwarf-with-dsym` for Release (check: `xcodebuild -showBuildSettings -scheme <S> -configuration Release | grep DEBUG_INFORMATION_FORMAT`). Do it for every target that ships code (app, extensions, frameworks).
2. Upload method:

| Backend | Automatic | Manual (for an archive or CI) |
|---|---|---|
| Crashlytics (SPM) | Run Script build phase after "Compile Sources": `"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run"`, with Input Files `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}`, `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${PRODUCT_NAME}`, `$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)`, `$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/GoogleService-Info.plist`, `$(TARGET_BUILD_DIR)/$(EXECUTABLE_PATH)` (copy the current list from Firebase docs) | `<path>/upload-symbols -gsp GoogleService-Info.plist -p ios build/App.xcarchive/dSYMs` |
| Sentry | Wizard adds a build phase running `sentry-cli debug-files upload` | `sentry-cli debug-files upload --include-sources -o <org> -p <project> build/App.xcarchive/dSYMs` |

3. Flutter obfuscation: `flutter build ipa --obfuscate --split-debug-info=build/symbols`, then `firebase crashlytics:symbols:upload --app=<FIREBASE_APP_ID> build/symbols` (Crashlytics) or the `sentry_dart_plugin` upload (Sentry). Keep `build/symbols` per release; without it Dart frames stay obfuscated.
4. React Native: JS stack traces need source maps for the Hermes bundle; the Sentry wizard configures upload; for Crashlytics JS errors are recorded as non-fatal via `crashlytics().recordError`, read its docs for source map support.
5. Since Xcode 14, bitcode is gone, so the dSYMs from your own archive are the ones to upload; no App Store Connect download is needed.

### Output
dSYM upload wired.

### Quality Gate
- After an archive, UUIDs match:
```bash
dwarfdump --uuid build/App.xcarchive/Products/Applications/App.app/App
dwarfdump --uuid build/App.xcarchive/dSYMs/App.app.dSYM
```
  Both print the same UUID per architecture.
- The vendor's console lists that UUID as uploaded (Crashlytics: dSYMs tab; Sentry: Debug Files).

---

## Phase 3: Prove a Symbolicated Crash

### Entry Criteria
- Phase 2 gates passed.

### Actions
1. Add a debug-only trigger (hidden menu or launch argument under `#if DEBUG`, or a TestFlight-only flag): `fatalError("Crash test")` or Crashlytics' documented test crash button snippet.
2. Install a Release-configuration build (TestFlight or archive installed via Xcode Devices). Stop the Xcode debugger: crash reporters cannot capture a crash while a debugger is attached.
3. Launch from the home screen, trigger the crash, then launch the app again (reports upload on next launch).
4. In the console, open the issue and confirm the top frame shows your function name, file and line, not `App + 0x1a2b3c`.
5. Record a non-fatal: `Crashlytics.crashlytics().record(error:)` or `SentrySDK.capture(error:)`, and confirm it appears.
6. Privacy: include the SDK's `PrivacyInfo.xcprivacy` (vendors ship one in the package) and declare crash data in App Store Connect App Privacy (handled in `mob-ios-app-store-release`).

### Output
`ios_crash_setup`.

### Quality Gate
- Console screenshot or link shows the test crash with symbolicated function and line.
- The non-fatal event is visible.

---

## Worked Example

Illustrative only. Native SwiftUI app, `crash_backend=crashlytics`, SPM.

Phase 2:
```
$ dwarfdump --uuid build/Shop.xcarchive/Products/Applications/Shop.app/Shop
UUID: 4C1D9E52-7A0B-3F55-9C2D-8E1A6B7F0C33 (arm64) .../Shop
$ dwarfdump --uuid build/Shop.xcarchive/dSYMs/Shop.app.dSYM
UUID: 4C1D9E52-7A0B-3F55-9C2D-8E1A6B7F0C33 (arm64) .../Shop
```
Phase 3: crash issue top frame `OrdersModel.debugCrash() OrdersModel.swift:88`.

---

## Exit Criteria

DONE when one crash SDK initializes at launch, Release builds produce dSYMs that upload automatically with matching UUIDs, and a forced crash and a non-fatal show symbolicated frames in the console.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Crashlytics could not find GoogleService-Info.plist` | **Adjust**: add the file to the app target's Copy Bundle Resources. |
| Phase 2 | Console says "Missing dSYM" with a UUID | **Adjust**: find the dSYM with `mdfind "com_apple_xcode_dsym_uuids == <UUID>"` and upload it manually. |
| Phase 3 | No crash appears | **Adjust**: debugger was attached or the app was not relaunched; repeat from the home screen. |
| Phase 3 | Dart frames obfuscated | **Adjust**: upload `--split-debug-info` symbols for that build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
