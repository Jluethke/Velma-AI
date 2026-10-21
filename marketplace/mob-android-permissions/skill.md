# Android Runtime Permissions

**One-line description:** Maps each capability to the exact manifest permissions for the app's `minSdk` to `targetSdk` range (API 33 notification and media permissions, API 34 partial photo access, API 31 Bluetooth and approximate location, API 30 separate background location), prefers permission-free pickers, implements the grant/rationale/permanently-denied decision table with `ActivityResultContracts`, audits the merged manifest, and tests with `adb shell pm grant/revoke`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`; `android_min_sdk` and `android_target_sdk` decide which permissions apply.
- `permission_needs` (object[], required): Each capability and the user action that triggers it.

---

## Outputs

- `android_permission_plan` (object): Per capability: alternative or permission set with `maxSdkVersion`, request site, decision-table handling, merged-manifest audit, test results.

---

## Phase 1: Map Capabilities to Manifest Entries

### Entry Criteria
- `app_profile.stack` is `android`, `react-native` or `flutter`.

### Actions
1. Permission-free alternatives first:

| Need | Alternative |
|---|---|
| Pick photos/videos | Photo Picker: `ActivityResultContracts.PickVisualMedia()` / `PickMultipleVisualMedia()` (no permission; backported through Google Play services) |
| Pick a file | `ActivityResultContracts.OpenDocument()` (Storage Access Framework) |
| Take one photo | `ActivityResultContracts.TakePicture()` launches the camera app; `CAMERA` permission is still required if the manifest declares it |

2. Remaining capabilities, by API level:

| Capability | Manifest entries |
|---|---|
| Notifications | `POST_NOTIFICATIONS` (runtime on API 33+; no effect below) |
| Read own images/video (gallery app) | API 33+: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`; API 34+: add `READ_MEDIA_VISUAL_USER_SELECTED` for partial access; up to 32: `READ_EXTERNAL_STORAGE` with `android:maxSdkVersion="32"` |
| Precise location | `ACCESS_FINE_LOCATION` plus `ACCESS_COARSE_LOCATION` (API 31+ requires requesting both; the user may grant only approximate) |
| Background location | `ACCESS_BACKGROUND_LOCATION`, requested separately after foreground is granted (API 30+ sends the user to Settings) |
| Bluetooth scan/connect | API 31+: `BLUETOOTH_SCAN` (with `android:usesPermissionFlags="neverForLocation"` if not deriving location), `BLUETOOTH_CONNECT`; up to 30: `BLUETOOTH`, `BLUETOOTH_ADMIN` with `maxSdkVersion="30"` plus location |
| Camera, microphone | `CAMERA`, `RECORD_AUDIO` |
| Exact alarms | `SCHEDULE_EXACT_ALARM` (user-revocable) or `USE_EXACT_ALARM` (restricted by Play policy to alarm/calendar apps) |

3. Only entries within `android_min_sdk`..`android_target_sdk` matter; still add `maxSdkVersion` to legacy ones so newer devices do not show them.
4. Cross-platform: React Native `PermissionsAndroid.request` or `react-native-permissions` `request(PERMISSIONS.ANDROID.CAMERA)`; Flutter `permission_handler` `Permission.camera.request()`. Manifest entries are still added by you in `android/app/src/main/AndroidManifest.xml`.

### Output
Manifest edits.

### Quality Gate
- `./gradlew :app:processDebugMainManifest` exits 0, then the merged manifest (`app/build/intermediates/merged_manifest/debug/AndroidManifest.xml` or the path printed by AGP for your version) lists exactly the intended `<uses-permission>` entries.
- Every permission added by a library but not needed is removed with `<uses-permission android:name="..." tools:node="remove"/>`, and the merged manifest confirms it.

---

## Phase 2: Request With the Decision Table

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. Compose:
```kotlin
val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted -> onResult(granted) }
// on the triggering action:
when {
    ContextCompat.checkSelfPermission(ctx, CAMERA) == PERMISSION_GRANTED -> proceed()
    activity.shouldShowRequestPermissionRationale(CAMERA) -> showRationale(onContinue = { launcher.launch(CAMERA) })
    prefs.askedBefore(CAMERA) -> showOpenSettings()   // permanently denied
    else -> { prefs.markAsked(CAMERA); launcher.launch(CAMERA) }
}
```
   Use `RequestMultiplePermissions()` for fine plus coarse location and check which one was granted.
2. Decision table:

| Granted | `shouldShowRequestPermissionRationale` | Asked before | Do |
|---|---|---|---|
| yes | any | any | proceed |
| no | true | yes | show rationale, then request |
| no | false | no | first request: request directly |
| no | false | yes | permanently denied: explain and open `Settings.ACTION_APPLICATION_DETAILS_SETTINGS` with `Uri.fromParts("package", packageName, null)` |

   `shouldShowRequestPermissionRationale` alone cannot tell "never asked" from "permanently denied"; the stored "asked before" flag is required.
3. Notifications on API 33+: request after the user turns on a notification feature, not at first launch. Below 33, check `NotificationManagerCompat.from(ctx).areNotificationsEnabled()`.
4. Do NOT request from `onCreate` on launch, and do NOT call a protected API before the check (lint `MissingPermission`).

### Output
Request code.

### Quality Gate
- `./gradlew :app:lintDebug` reports zero `MissingPermission` issues (`grep -c MissingPermission app/build/reports/lint-results-debug.txt` prints 0).
- Every capability has all four table rows handled.

---

## Phase 3: Test the Table

### Entry Criteria
- Phase 2 builds and installs.

### Actions
1. Exercise states with adb (package from `applicationId`):
```bash
adb shell pm revoke <pkg> android.permission.CAMERA
adb shell pm grant <pkg> android.permission.CAMERA
adb shell pm clear-permission-flags <pkg> android.permission.CAMERA user-set user-fixed   # back to "never asked"
adb shell dumpsys package <pkg> | grep -A3 "android.permission.CAMERA"
```
   If `clear-permission-flags` is not available on the device's version (`adb shell pm help`), use `adb shell pm clear <pkg>` (also wipes app data).
2. Permanently denied: deny twice in the system dialog on API 30+ (the second denial counts as "don't ask again"), then confirm the Settings path appears.
3. Instrumented tests: `GrantPermissionRule.grant(android.Manifest.permission.CAMERA)` for the granted path; UI Automator to click the system dialog button for others.
4. Test on one device at `android_min_sdk` and one at `android_target_sdk` (see `mob-device-os-matrix`).

### Output
`android_permission_plan`.

### Quality Gate
- A result row exists for each capability x row of the decision table, with the observed screen and the API level tested.

---

## Worked Example

Illustrative only. `minSdk 26`, `targetSdk 35`; needs: notifications for order updates, camera for scanning, attach photos.

Phase 1: photos via `PickVisualMedia` (no permission); merged manifest showed `READ_EXTERNAL_STORAGE` from an image library, removed with `tools:node="remove"`; `POST_NOTIFICATIONS` and `CAMERA` added.

Phase 3:
```
$ adb shell pm revoke com.shop.app android.permission.POST_NOTIFICATIONS
$ adb shell dumpsys package com.shop.app | grep -A1 POST_NOTIFICATIONS
      android.permission.POST_NOTIFICATIONS: granted=false, flags=[ USER_SET ...]
# Toggle "Order updates" -> rationale sheet -> system dialog (API 34 emulator)
```

---

## Exit Criteria

DONE when the merged manifest holds only needed permissions with correct SDK bounds, requests follow the four-row table from the triggering action, lint shows no `MissingPermission`, and every row was exercised on the floor and target API levels.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Play Console flags a sensitive permission you did not add | **Adjust**: find the library in the merged manifest blame (`manifest-merger-blame-debug-report.txt`) and remove it with `tools:node="remove"`. |
| Phase 2 | Request dialog never shows | **Adjust**: permission missing from manifest, or permanently denied; check `dumpsys package`. |
| Phase 2 | `SecurityException` on camera open | **Stop**: a code path skips the check; fix the caller, do not catch and ignore. |
| Phase 3 | Background location dialog does not offer "Allow all the time" | **Adjust**: expected on API 30+; the user must choose it in Settings; implement the Settings path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
