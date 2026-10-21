# iOS App Store Release Checklist

**One-line description:** Takes a tested iOS build to App Store submission: bumps `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`, checks the privacy manifest, purpose strings, export compliance and App Review guideline items that commonly cause rejection, archives and exports with `xcodebuild`, uploads to TestFlight, and records a phased release plan with stop conditions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `matrix_run_report` (object, required): From `mob-device-os-matrix`; release blocks on open failures.
- `ios_crash_setup` (object, required): From `mob-ios-crash-reporting`.
- `release_version` (string, required): Marketing version for this release, for example `2.4.0`.

---

## Outputs

- `ios_release_checklist` (object): Each check with command output or console evidence, archive path, upload result, TestFlight build number, phased-release plan and stop conditions.

---

## Phase 1: Version and Gate on Test Results

### Entry Criteria
- `matrix_run_report` has zero open failures, or each open failure has a written user decision to ship anyway.
- `ios_crash_setup` shows a symbolicated test crash.

### Actions
1. Set versions (Xcode 11+ projects store them as build settings):
```bash
xcodebuild -showBuildSettings -scheme <S> | grep -E "MARKETING_VERSION|CURRENT_PROJECT_VERSION"
agvtool new-marketing-version <release_version>   # needs VERSIONING_SYSTEM = apple-generic
agvtool next-version -all
```
   If `agvtool` is not set up, edit `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in the target's build settings. `CURRENT_PROJECT_VERSION` (CFBundleVersion) must be higher than any build already uploaded for this version.
2. Cross-platform: Flutter `flutter build ipa --build-name=<release_version> --build-number=<n>` (or `version: 2.4.0+57` in `pubspec.yaml`); Expo `eas build -p ios --profile production` with `autoIncrement` in `eas.json` if used.

### Output
Versions set.

### Quality Gate
- `xcodebuild -showBuildSettings -scheme <S> -configuration Release | grep -E "MARKETING_VERSION|CURRENT_PROJECT_VERSION"` prints `release_version` and a build number higher than the last uploaded one (App Store Connect > TestFlight shows it).

---

## Phase 2: Compliance Checks

### Entry Criteria
- Phase 1 complete.

### Actions
1. Privacy manifest: `PrivacyInfo.xcprivacy` in the app target declaring `NSPrivacyAccessedAPITypes` for required-reason APIs the app calls (for example `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1` for app-only UserDefaults access; pick the reason code from Apple's "Describing use of required reason API" list, do not guess). Third-party SDKs on Apple's list must ship their own manifest and signature.
   - Generate the report: Xcode Organizer > select archive > Generate Privacy Report (after Phase 3 archive); every collected data type must match the App Privacy answers in App Store Connect.
2. Purpose strings: every `NS*UsageDescription` in `Info.plist` is specific (see `mob-ios-permissions`).
3. Export compliance: set `ITSAppUsesNonExemptEncryption` in `Info.plist` to `NO` if the app only uses exempt encryption (HTTPS through system APIs); otherwise answer the export compliance questions and keep documentation.
4. App Review items that commonly reject (App Review Guidelines section numbers):
   - Account creation present: in-app account deletion exists (5.1.1(v)).
   - Third-party or social login present: an equivalent privacy-focused login option such as Sign in with Apple is offered (4.8).
   - Digital goods sold: uses In-App Purchase (3.1.1).
   - Login required: demo account credentials in App Review Information.
5. SDK requirement: Apple sets a minimum Xcode/SDK for uploads on its "Upcoming requirements" page. Compare with `xcodebuild -version`; record the date checked.

### Output
Compliance section of the checklist.

### Quality Gate
- `plutil -lint <App>/PrivacyInfo.xcprivacy` prints `OK`.
- `/usr/libexec/PlistBuddy -c "Print :ITSAppUsesNonExemptEncryption" Info.plist` prints a value, or the export compliance answer is recorded.
- Each guideline item is marked `applies: yes/no` with evidence.

---

## Phase 3: Archive, Export and Upload

### Entry Criteria
- Phase 2 complete; distribution certificate and App Store provisioning (automatic signing or match) available.

### Actions
1. Archive:
```bash
xcodebuild archive -scheme <S> -configuration Release -destination 'generic/platform=iOS' -archivePath build/<App>.xcarchive
```
2. `ExportOptions.plist` with `method` = `app-store-connect` (Xcode 15.3+; earlier `app-store`), `destination` = `upload` to send it directly, plus `teamID`. Then:
```bash
xcodebuild -exportArchive -archivePath build/<App>.xcarchive -exportPath build/export -exportOptionsPlist ExportOptions.plist -allowProvisioningUpdates
```
   Alternatives: Xcode Organizer > Distribute App, Transporter app, or `fastlane pilot upload` if the project uses fastlane.
3. Upload dSYMs from `build/<App>.xcarchive/dSYMs` if the automatic phase did not run (see `mob-ios-crash-reporting`).
4. Wait for processing (App Store Connect email or TestFlight tab). Fix any `ITMS-` error emails before continuing.

### Output
Build uploaded and processed.

### Quality Gate
- Export log ends with `** EXPORT SUCCEEDED **` (with `destination upload`, it also reports the upload).
- The build number appears in TestFlight as processed, with no `ITMS-` errors.

---

## Phase 4: TestFlight and Phased Release

### Entry Criteria
- Phase 3 complete.

### Actions
1. Add the build to an internal testing group; fill "What to Test". External groups need Beta App Review.
2. Run the release smoke checklist on a TestFlight install: launch, sign in, each screen in `matrix_run_report`, kill and relaunch offline, crash-free in the crash console.
3. Submit for review with release notes, screenshots for required device sizes, and App Review notes (demo account).
4. Choose "Phased Release for Automatic Updates": Apple rolls out over 7 days (1%, 2%, 5%, 10%, 20%, 50%, 100% of users with automatic updates) and you can pause for up to 30 days total. Write stop conditions now: the crash-free rate or new-issue count that makes you pause is a user decision; record it with the backend's metric name.
5. Do NOT submit while a stop condition from a previous release is still unresolved.

### Output
`ios_release_checklist`.

### Quality Gate
- Every smoke step has pass/fail recorded on a named device and iOS version.
- Phased release is on (or off with a written reason), and stop conditions name a metric and value chosen by the user.

---

## Worked Example

Illustrative only. `release_version=2.4.0`, last uploaded build 56.

Phase 1: `agvtool new-marketing-version 2.4.0`, build 57.

Phase 2: privacy manifest declares UserDefaults `CA92.1` and file timestamp `C617.1`; `ITSAppUsesNonExemptEncryption` NO; account deletion present (5.1.1(v)); Google sign-in present, Sign in with Apple present (4.8).

Phase 3:
```
$ xcodebuild -exportArchive -archivePath build/Shop.xcarchive -exportPath build/export -exportOptionsPlist ExportOptions.plist
** EXPORT SUCCEEDED **
```
Phase 4: stop condition chosen by the owner: pause if the crash backend's crash-free users for 2.4.0 falls below the 2.3.x value by any amount over the first 48 h.

---

## Exit Criteria

DONE when versions are bumped, compliance items have evidence, the build is uploaded and processed with dSYMs, TestFlight smoke passes, and the phased-release plan has explicit stop conditions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `The bundle version must be higher than the previously uploaded version` | **Adjust**: raise `CURRENT_PROJECT_VERSION`. |
| Phase 2 | Email `ITMS-91053: Missing API declaration` | **Adjust**: add the named API category and reason to `PrivacyInfo.xcprivacy`. |
| Phase 3 | `No signing certificate "iOS Distribution" found` | **Adjust**: enable automatic signing with `-allowProvisioningUpdates` or install the certificate; do not change bundle id. |
| Phase 4 | Rejected under a guideline | **Return**: record the guideline number and message; fix and resubmit, or reply in Resolution Center. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
