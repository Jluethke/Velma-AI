# Mobile Device and OS Test Matrix

**One-line description:** Builds the device and OS matrix from the app's declared floors and targets plus the OS versions whose behavior changes touch the app's features (not from guessed market shares), adds form-factor and settings rows (smallest screen, tablet, foldable, low-RAM, largest font, dark mode, right-to-left), and runs the UI suite across it with simulators, Gradle Managed Devices or Firebase Test Lab.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `usage_analytics` (object, optional): Exported device model and OS version counts from the app's analytics or the Play Console / App Store Connect, plus the share cutoff the user chooses.

---

## Outputs

- `device_matrix` (object[]): Rows of platform, device model or profile, OS version, settings (font scale, dark mode, locale), and the reason the row exists.
- `matrix_run_report` (object): Per row: command run, pass/fail counts, failures with links to artifacts.

---

## Phase 1: Derive OS Rows From the App

### Entry Criteria
- `app_profile` has `ios_deployment_target` and/or `android_min_sdk` and `android_target_sdk`.

### Actions
1. Required OS rows per shipped platform:
   - iOS: the deployment target's major version and the latest released iOS major.
   - Android: `android_min_sdk`, `android_target_sdk`, and the latest released API level if higher.
2. Add every OS version in the range where a platform behavior change touches a feature the app uses (check against `app_profile.libraries` and the app's manifest/plist):

| Platform version | Behavior change (official release notes) | Add row if app uses |
|---|---|---|
| Android 10 (API 29) | Scoped storage | file access |
| Android 11 (API 30) | Package visibility, one-time permissions, background location separate | intents to other apps, location |
| Android 12 (API 31) | Exact alarm permission, Bluetooth permissions, approximate location, splash screen API, foreground service start limits | alarms, BLE, location, FGS |
| Android 13 (API 33) | `POST_NOTIFICATIONS`, granular media permissions, per-app language | notifications, media |
| Android 14 (API 34) | Foreground service types required, partial photo access, nonlinear font scaling to 200% | FGS, photos, text |
| Android 15 (API 35) | Edge-to-edge enforced when targeting 35 | any UI when `targetSdk >= 35` |
| iOS 14 | Limited photo access, App Tracking Transparency, approximate location | photos, IDFA, location |
| iOS 17 | Calendar full/write-only access, Observation framework, accessibility audit API | calendar, `@Observable` |
| iOS 18 | Limited contacts access | contacts |

   Check the release notes for OS versions newer than this table and add rows the same way.
3. If `usage_analytics` is provided, add every OS version and device model above the user's cutoff. Do not invent a cutoff; if the user gives none, record it as an open question and skip this step.

### Output
OS rows with reasons.

### Quality Gate
- Every row has a reason column citing either a floor/target, a release-note change, or the analytics cutoff.

---

## Phase 2: Add Form-Factor and Settings Rows

### Entry Criteria
- Phase 1 complete.

### Actions
1. Add rows:

| Row | iOS | Android |
|---|---|---|
| Smallest supported screen | iPhone SE (3rd generation) simulator | small phone profile (for example Pixel 4a-sized AVD or GMD `device = "Pixel 2"`) |
| Tablet | iPad simulator, only if `TARGETED_DEVICE_FAMILY` includes 2 | tablet AVD, only if the app does not lock to phones |
| Foldable / resizable | n/a | foldable AVD (for example `Pixel Fold`) if `resizeableActivity` is not false |
| Low RAM | n/a | Android Go system image or `ActivityManager.isLowRamDevice()` true device if users run them |
| Largest text | Dynamic Type `accessibility-extra-extra-extra-large` | `font_scale 2.0` |
| Dark mode | `xcrun simctl ui booted appearance dark` | `adb shell cmd uimode night yes` |
| Right-to-left | Scheme > Run > Options > App Language "Right-to-Left Pseudolanguage" | pseudo-locale `ar-XB` (enable `pseudoLocalesEnabled = true` in the debug build type) |

2. Physical-device rows: include at least one physical device per platform for things the emulator cannot do (camera, background task timing, push, biometrics). Name them.
3. Keep the matrix small: settings rows can share one OS version (the target).

### Output
`device_matrix`.

### Quality Gate
- Each settings row names the exact command or setting used to apply it.
- `python -m json.tool device_matrix.json` exits 0.

---

## Phase 3: Run the Suite Across the Matrix

### Entry Criteria
- UI test commands from `app_profile` pass on one local device.

### Actions
1. iOS simulators:
```bash
xcrun simctl list runtimes            # installed runtimes; install missing ones in Xcode > Settings > Components
xcrun simctl create "SE3-iOS17" "com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation" "com.apple.CoreSimulator.SimRuntime.iOS-17-5"
xcodebuild test -scheme <S> -only-testing:<UITestTarget> \
  -destination 'platform=iOS Simulator,name=SE3-iOS17' -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.1' \
  -resultBundlePath build/matrix.xcresult
```
   Multiple `-destination` flags run the tests on each. Use identifiers printed by `xcrun simctl list devicetypes` and `runtimes`.
2. Android Gradle Managed Devices (AGP 7.3+):
```kotlin
testOptions { managedDevices { localDevices {
    create("pixel2api26") { device = "Pixel 2"; apiLevel = 26; systemImageSource = "aosp" }
    create("pixel6api34") { device = "Pixel 6"; apiLevel = 34; systemImageSource = "google" }
} } }
```
   Run `./gradlew pixel2api26DebugAndroidTest pixel6api34DebugAndroidTest`. The DSL names changed across AGP versions (`localDevices`/`devices`); check the docs for your AGP.
3. Firebase Test Lab (when physical models are needed and the project has a Firebase project):
```bash
gcloud firebase test android models list
gcloud firebase test android run --type instrumentation --app app-debug.apk --test app-debug-androidTest.apk \
  --device model=<MODEL_ID>,version=<API>,locale=en,orientation=portrait
xcodebuild build-for-testing -scheme <S> -sdk iphoneos -derivedDataPath build/dd   # then zip Debug-iphoneos and the .xctestrun file
gcloud firebase test ios run --test build/ios_tests.zip --device model=<MODEL_ID>,version=<VERSION>
```
4. Record each row's result in `matrix_run_report`. A failure on one row only is a real finding: open it with the row's OS and device; do not drop the row.

### Output
`matrix_run_report`.

### Quality Gate
- Every row in `device_matrix` has a result (pass counts, failures, or `not run` with reason).
- No row was removed after a failure (row count in report equals row count in matrix).

---

## Worked Example

Illustrative only. App: iOS 16.0 target, Android `minSdk 26`, `targetSdk 35`; uses notifications, photos, FGS for uploads; iPhone only.

Phase 1 rows: iOS 16, iOS 18 (latest); Android 26, 33 (notifications/media), 34 (FGS types, partial photos), 35 (target, edge-to-edge).

Phase 2: SE 3rd gen iOS 16, `font_scale 2.0` on API 35, dark mode, `ar-XB`, physical Pixel 7 and iPhone 13.

Phase 3:
```
$ ./gradlew pixel2api26DebugAndroidTest pixel6api35DebugAndroidTest
> Task :app:pixel2api26DebugAndroidTest
Finished 14 tests on pixel2api26
> Task :app:pixel6api35DebugAndroidTest
OrdersScreenTest > errorState_retry_showsContent FAILED  (status bar overlaps retry button; edge-to-edge)
```
Failure on API 35 recorded with screenshot; row kept.

---

## Exit Criteria

DONE when every matrix row has a stated reason, settings rows name their exact command, and every row has a recorded run result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No analytics and no cutoff | **Adjust**: build from floors, targets and release notes only; log the open question. |
| Phase 3 | Simulator runtime missing | **Adjust**: install it in Xcode > Settings > Components or `xcodebuild -downloadPlatform iOS`; record version. |
| Phase 3 | GMD image download fails | **Retry**: rerun with `--info`; check `systemImageSource` value for that API level. |
| Phase 3 | Test Lab quota or billing error | **Return**: report it; run local rows only and mark cloud rows `not run`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
