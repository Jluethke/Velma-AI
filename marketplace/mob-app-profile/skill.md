# Mobile App Profile

**One-line description:** Confirms the app's stack (SwiftUI, Jetpack Compose, React Native or Flutter) from files on disk, reads the exact OS floors and SDK levels from build settings, inventories the state, networking, storage, test and crash libraries already in use, and proves the baseline build and test commands run before any change is made.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Absolute path to the app repository root.
- `stack` (string, required): One of `ios`, `android`, `react-native`, `flutter`. Every later flow branches on this value.

---

## Outputs

- `app_profile` (object): `stack`, `ios_deployment_target`, `android_min_sdk`, `android_target_sdk`, `android_compile_sdk`, toolchain versions, `libraries` (state, networking, storage, test, crash, DI), `build_cmd`, `unit_test_cmd`, `ui_test_cmd`, baseline exit codes, and `preexisting_failures`.

---

## Phase 1: Confirm the Stack From Files

### Entry Criteria
- `project_dir` exists and is readable.
- `stack` is one of the four allowed values. Any other value: **Stop**.

### Actions
1. From `project_dir`, list marker files. Do NOT guess from the folder name.
```bash
ls -a; find . -maxdepth 3 \( -name "*.xcodeproj" -o -name "*.xcworkspace" -o -name Package.swift -o -name "build.gradle*" -o -name settings.gradle* -o -name pubspec.yaml -o -name package.json -o -name app.json -o -name "app.config.*" \) -not -path "*/node_modules/*" -not -path "*/Pods/*"
```
2. Apply this table top to bottom; the first row that matches is the detected stack:

| Marker | Detected stack |
|---|---|
| `pubspec.yaml` containing `flutter:` under `dependencies` | `flutter` |
| `package.json` with `"react-native"` in `dependencies` | `react-native` (add `expo: true` when `"expo"` is also a dependency) |
| `*.xcodeproj` or `*.xcworkspace` and no Gradle files at the root | `ios` |
| `settings.gradle(.kts)` plus `app/src/main/AndroidManifest.xml` and no Xcode project at the root | `android` |

3. If the detected stack differs from `stack`, **Stop** and report both values. Do not continue on a mismatch; every later flow would edit the wrong files.

### Output
Detected stack and the marker that decided it.

### Quality Gate
- The marker file path that matched is quoted in the profile.
- Detected stack equals `stack`.

---

## Phase 2: Read OS Floors and Toolchain Versions

### Entry Criteria
- Phase 1 passed.

### Actions
1. iOS (stacks `ios`, `react-native`, `flutter`; the last two read from the `ios/` folder):
```bash
xcodebuild -version
xcodebuild -list -project <App>.xcodeproj        # or -workspace <App>.xcworkspace
xcodebuild -showBuildSettings -scheme <Scheme> | grep -E "IPHONEOS_DEPLOYMENT_TARGET|SWIFT_VERSION|MARKETING_VERSION|CURRENT_PROJECT_VERSION|PRODUCT_BUNDLE_IDENTIFIER|TARGETED_DEVICE_FAMILY"
```
   For CocoaPods projects also read `platform :ios, '<x>'` from `ios/Podfile`. If Podfile and build setting disagree, record both; the higher one is the effective floor.
2. Android (stacks `android`, `react-native`, `flutter`; the last two read from `android/app/build.gradle(.kts)`):
```bash
./gradlew --version
grep -nE "minSdk|targetSdk|compileSdk|minSdkVersion|targetSdkVersion|compileSdkVersion|versionCode|versionName|applicationId" app/build.gradle*
grep -nE "agp|androidGradlePlugin|com.android.application|kotlin" gradle/libs.versions.toml build.gradle* 2>/dev/null
```
   Flutter projects often show `minSdk = flutter.minSdkVersion`. Then the value comes from the Flutter SDK; read it from `flutter build apk --debug -v 2>&1 | grep -i minSdk` or from the merged manifest in `build/app/intermediates/merged_manifest/`.
3. React Native: `npx react-native info` (or `npx expo-doctor` and `npx expo config --type public` for Expo). Record React Native version and whether Hermes and the New Architecture are enabled (`newArchEnabled` in `android/gradle.properties`, `RCT_NEW_ARCH_ENABLED` in the Podfile environment).
4. Flutter: `flutter --version` and `flutter doctor -v`. Record the `environment: sdk:` constraint from `pubspec.yaml`.

### Output
Floors and versions section of `app_profile`.

### Quality Gate
- Every applicable field (`ios_deployment_target`, `android_min_sdk`, `android_target_sdk`, `android_compile_sdk`) holds a number copied from command output, or the literal `not_applicable` for a platform the stack does not ship.
- No version is written from memory; each cites the command that printed it.

---

## Phase 3: Inventory Libraries

### Entry Criteria
- Phase 2 complete.

### Actions
1. Read the lock or manifest file for the stack, never the source code alone:

| Stack | File(s) / command |
|---|---|
| ios | `*.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`, `Podfile.lock` |
| android | `./gradlew :app:dependencies --configuration releaseRuntimeClasspath > deps.txt` |
| react-native | `package.json`, `package-lock.json` or `yarn.lock`, `ios/Podfile.lock` |
| flutter | `pubspec.yaml`, `pubspec.lock` |

2. Fill each `libraries` slot with what is present (or `none`):
   - state: Observation/Combine, ViewModel+StateFlow, Redux Toolkit/Zustand/XState, Riverpod/Bloc/Provider
   - networking: URLSession/Alamofire, OkHttp/Retrofit/Ktor, fetch/axios/TanStack Query, dio/http
   - storage: SwiftData/Core Data/GRDB, Room/DataStore, AsyncStorage/MMKV/expo-sqlite/op-sqlite, drift/sqflite/shared_preferences
   - test: XCTest/Swift Testing, JUnit/Espresso/Compose UI test/Robolectric, Jest/Detox, flutter_test/integration_test/patrol
   - crash: Firebase Crashlytics, Sentry, Bugsnag, none
   - DI: Hilt/Koin, Swinject/Factory, none
3. Rule: later flows must use the library already present in a slot. Adding a second library for a filled slot needs the user's written approval.

### Output
`libraries` section of `app_profile`.

### Quality Gate
- Each slot names a package with its version from the lock file, or `none`.

---

## Phase 4: Prove the Baseline Commands

### Entry Criteria
- Phase 3 complete. Simulator or emulator available for UI tests, or `ui_test_cmd` recorded as `unavailable`.

### Actions
1. Pick commands by stack (adjust scheme and module names from Phase 2):

| Stack | `build_cmd` | `unit_test_cmd` | `ui_test_cmd` |
|---|---|---|---|
| ios | `xcodebuild -scheme <S> -destination 'generic/platform=iOS Simulator' build` | `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' -only-testing:<UnitTarget>` | same with `-only-testing:<UITestTarget>` |
| android | `./gradlew :app:assembleDebug` | `./gradlew :app:testDebugUnitTest` | `./gradlew :app:connectedDebugAndroidTest` |
| react-native | `npx tsc --noEmit` then the native build of each platform | `npx jest` | `npx detox test -c <config>` |
| flutter | `flutter build apk --debug` and/or `flutter build ios --simulator --debug` | `flutter test` | `flutter test integration_test -d <deviceId>` |

   `<device>` must be a name printed by `xcrun simctl list devices available`; do not type a device name that is not in that list.
2. Run each command once and record the exit code and the last 20 lines of output.
3. If a command fails before you changed anything, record it in `preexisting_failures` with the failing test names. Do NOT fix it here and do NOT delete or skip those tests.

### Output
`app_profile`.

### Quality Gate
- Each of `build_cmd`, `unit_test_cmd`, `ui_test_cmd` has a recorded exit code, or `unavailable` with the reason.
- Every non-zero exit code has a matching entry in `preexisting_failures`.

---

## Worked Example

Illustrative only. `project_dir=/src/shoplist`, `stack=android`.

Phase 1: `settings.gradle.kts` and `app/src/main/AndroidManifest.xml` found, no Xcode project. Detected `android`, matches.

Phase 2:
```
$ grep -nE "minSdk|targetSdk|compileSdk" app/build.gradle.kts
14:        minSdk = 26
15:        targetSdk = 35
11:    compileSdk = 35
```
Phase 3: `deps.txt` shows `androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7`, `com.squareup.okhttp3:okhttp:4.12.0`, `androidx.room:room-runtime:2.6.1`, `com.google.firebase:firebase-crashlytics`, Hilt 2.52.

Phase 4: `./gradlew :app:assembleDebug` exit 0; `./gradlew :app:testDebugUnitTest` exit 1 with `CartRepositoryTest > totals_roundsHalfUp FAILED`, recorded in `preexisting_failures`; `connectedDebugAndroidTest` exit 0 on `Pixel_7_API_34`.

---

## Exit Criteria

DONE when the stack is confirmed from files, every OS floor and SDK level is copied from command output, every library slot is filled from a lock file, and the three baseline commands have recorded results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Detected stack differs from `stack` | **Stop**: report both; ask the user which is right. |
| Phase 1 | Monorepo with several apps | **Adjust**: ask for the app subfolder and rerun with it as `project_dir`. |
| Phase 2 | `xcodebuild` reports no scheme | **Adjust**: open the project once in Xcode or mark the scheme Shared, then rerun `xcodebuild -list`. |
| Phase 2 | Gradle sync fails (JDK mismatch) | **Adjust**: read the required JDK from the AGP error, set `JAVA_HOME`, rerun. |
| Phase 4 | Baseline build fails | **Return**: report the error to the user; later flows cannot prove anything on a red baseline. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
