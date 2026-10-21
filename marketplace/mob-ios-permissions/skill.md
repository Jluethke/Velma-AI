# iOS Runtime Permissions

**One-line description:** Maps each capability the feature needs to its exact `Info.plist` usage-description key and authorization API, prefers permission-free alternatives (PHPicker, Sign in with Apple button, location button), requests in context with a status decision table that handles denied, restricted and limited, and tests every status with `xcrun simctl privacy` and XCUITest `resetAuthorizationStatus`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `permission_needs` (object[], required): Each capability the feature uses (camera, microphone, photos read or add-only, location when-in-use or always, notifications, contacts, calendar, Bluetooth, tracking, Face ID, motion, local network) and the user action that triggers it.

---

## Outputs

- `ios_permission_plan` (object): Per capability: alternative chosen or permission kept, `Info.plist` key and string, request call site, status handling table, test results.

---

## Phase 1: Map Capabilities to Keys and Alternatives

### Entry Criteria
- `app_profile.stack` is `ios`, `react-native` or `flutter` (all ship an iOS binary with an `Info.plist`).

### Actions
1. First check whether a permission is needed at all:

| Need | Permission-free alternative |
|---|---|
| User picks photos/videos | `PHPickerViewController` / SwiftUI `PhotosPicker` (no photo library permission) |
| Save one image to Photos | Add-only: `NSPhotoLibraryAddUsageDescription` instead of full read access |
| One-time current location from a tap | `LocationButton` (CoreLocationUI, iOS 15) grants one-time access |
| Pick a contact | `CNContactPickerViewController` (no contacts permission) |

2. For each remaining capability, add the key to `Info.plist` (React Native: `ios/<App>/Info.plist`; Flutter: `ios/Runner/Info.plist`):

| Capability | Key | Status API |
|---|---|---|
| Camera | `NSCameraUsageDescription` | `AVCaptureDevice.authorizationStatus(for: .video)` |
| Microphone | `NSMicrophoneUsageDescription` | `AVAudioApplication.shared.recordPermission` (iOS 17) / `AVAudioSession.sharedInstance().recordPermission` |
| Photos read | `NSPhotoLibraryUsageDescription` | `PHPhotoLibrary.authorizationStatus(for: .readWrite)` |
| Location while using | `NSLocationWhenInUseUsageDescription` | `CLLocationManager().authorizationStatus` (iOS 14) |
| Location always | add `NSLocationAlwaysAndWhenInUseUsageDescription` | same |
| Contacts | `NSContactsUsageDescription` | `CNContactStore.authorizationStatus(for: .contacts)` |
| Calendar | `NSCalendarsFullAccessUsageDescription` or `NSCalendarsWriteOnlyAccessUsageDescription` (iOS 17) | `EKEventStore.authorizationStatus(for: .event)` |
| Bluetooth | `NSBluetoothAlwaysUsageDescription` | `CBManager.authorization` |
| Tracking (IDFA) | `NSUserTrackingUsageDescription` | `ATTrackingManager.trackingAuthorizationStatus` |
| Face ID | `NSFaceIDUsageDescription` | `LAContext().canEvaluatePolicy` |
| Motion | `NSMotionUsageDescription` | `CMMotionActivityManager.authorizationStatus()` |
| Local network | `NSLocalNetworkUsageDescription` (+ `NSBonjourServices` if browsing) | no status API; prompt on first use |
| Notifications | none | `UNUserNotificationCenter.current().notificationSettings()` |

3. Write each string as the specific reason ("Scan the barcode on your receipt"), not "This app needs camera access". App Review rejects vague strings (App Review Guideline 5.1.1).
4. Cross-platform specifics:
   - React Native `react-native-permissions` v4+: list only the needed handlers in `ios/Podfile` with `setup_permissions(['Camera', 'PhotoLibrary'])`, then `cd ios && pod install`.
   - Flutter `permission_handler`: in `ios/Podfile` `post_install`, enable only needed macros in `GCC_PREPROCESSOR_DEFINITIONS` (for example `'PERMISSION_CAMERA=1'`); unused permission code otherwise triggers App Store review questions.

### Output
Key table for this feature.

### Quality Gate
- `plutil -lint ios/<App>/Info.plist` (or the native app's plist) prints `OK`.
- `/usr/libexec/PlistBuddy -c "Print :NSCameraUsageDescription" Info.plist` (repeat per key) prints the string for every kept capability.

---

## Phase 2: Request in Context With a Status Table

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. Request only when the user performs the triggering action from `permission_needs`. Never request at launch or in `application(_:didFinishLaunchingWithOptions:)`. ATT is the one exception that must wait until the app is active (call it after `scenePhase == .active`).
2. Branch on status:

| Status | Behavior |
|---|---|
| `notDetermined` | Show your own one-screen explanation with a Continue button, then call the system request (`AVCaptureDevice.requestAccess(for:)`, `requestWhenInUseAuthorization()`, `PHPhotoLibrary.requestAuthorization(for: .readWrite)`, `requestAuthorization(options:)`) |
| `denied` | Explain and offer a button to `UIApplication.openSettingsURLString`; the system will not prompt again |
| `restricted` | Parental controls or MDM; explain that it is unavailable; no Settings button |
| `limited` (photos) | Proceed with the selected subset; offer `PHPhotoLibrary.shared().presentLimitedLibraryPicker(from:)` to change it |
| `authorized` / `authorizedWhenInUse` / `provisional` | Proceed |

3. Location always: request when-in-use first; ask for always only after a feature that needs background location is used (`requestAlwaysAuthorization()`).
4. Do NOT call the protected API before checking status, and do NOT loop the request after denial.
5. Accessing a protected resource without its key terminates the app with a log line like `This app has crashed because it attempted to access privacy-sensitive data without a usage description`.

### Output
Request code and status handling per capability.

### Quality Gate
- `grep -rn "requestAccess\|requestAuthorization\|requestWhenInUseAuthorization" <app sources>` shows call sites only inside action handlers named in `permission_needs`, none in app launch code.
- Every capability has a branch for each status in the table (code review by listing the `switch` cases).

---

## Phase 3: Test Every Status

### Entry Criteria
- Phase 2 builds.

### Actions
1. Simulator: `xcrun simctl privacy booted grant camera <bundle_id>`, `revoke`, `reset camera <bundle_id>`; services include `camera`, `microphone`, `photos`, `location`, `contacts`, `calendar` and more (`xcrun simctl privacy` with no arguments lists them). Run the flow after each and record what the screen shows. Simulator has no camera hardware; test capture on a device.
2. XCUITest: `app.resetAuthorizationStatus(for: .camera)` before launch (iOS 13.4+), then handle the system alert with `addUIInterruptionMonitor(withDescription:)` or by querying `XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.buttons["Allow"]`.
3. Device: Settings > Privacy & Security > <capability> > toggle off, and Settings > General > Transfer or Reset iPhone > Reset > Reset Location & Privacy for `notDetermined`.

### Output
`ios_permission_plan`.

### Quality Gate
- A results row exists for each capability x status (`notDetermined`, `denied`, `authorized`, plus `limited` for photos), each with the observed screen.
- The UI test run prints `** TEST SUCCEEDED **`.

---

## Worked Example

Illustrative only. Needs: scan a receipt (camera), attach a photo (picker), store location on a receipt (one tap).

Phase 1: photo attach uses `PhotosPicker` (no key); location uses `LocationButton`; camera keeps `NSCameraUsageDescription` = "Scan the barcode on your receipt to add it." `plutil -lint` prints `Info.plist: OK`.

Phase 3:
```
$ xcrun simctl privacy booted revoke camera com.shop.app
# Tap Scan -> "Camera access is off" sheet with Open Settings button (denied branch)
$ xcrun simctl privacy booted reset camera com.shop.app
# Tap Scan -> explanation screen -> system alert (notDetermined branch)
```

---

## Exit Criteria

DONE when unneeded permissions are replaced by permission-free APIs, every kept capability has a specific usage string, requests happen only from the triggering action, every status is handled, and each status was exercised.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | App Store Connect warning `ITMS-90683: Missing purpose string` for a key the app does not use | **Adjust**: a dependency links the API; add an honest string or remove the unused module (`permission_handler` macros, `setup_permissions`). |
| Phase 2 | No system alert appears | **Adjust**: status is already `denied`; use `simctl privacy reset`. |
| Phase 3 | UI test hangs on the system alert | **Adjust**: interact with the app after adding the interruption monitor; the monitor fires only on the next interaction. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
