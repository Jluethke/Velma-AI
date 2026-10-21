# iOS Background Work Within System Limits

**One-line description:** Maps each background job to the one iOS mechanism that allows it (finish-up task assertion, `BGAppRefreshTask`, `BGProcessingTask`, background `URLSession`, or background push), registers identifiers in `Info.plist` and at launch, handles expiration and rescheduling, and triggers tasks on a device from LLDB with `_simulateLaunchForTaskWithIdentifier` because the system decides real timing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `background_jobs` (object[], required): Each job: what it does, what triggers it, whether it needs network or power, payload size, and what the user loses if it runs late or never.

---

## Outputs

- `ios_background_plan` (object): Per job: mechanism, task identifier, `Info.plist` entries, registration and scheduling code paths, expiration handling, device test results.

---

## Phase 1: Choose a Mechanism per Job

### Entry Criteria
- `app_profile.stack` is `ios`, `react-native` or `flutter`.

### Actions
1. iOS gives no guaranteed periodic execution. A job that "must run every N minutes" in the background cannot be built; record it as a product decision and continue with the closest mechanism.
2. Apply:

| Job | Mechanism | Key facts |
|---|---|---|
| Finish a save or upload already started when the user leaves the app | `UIApplication.shared.beginBackgroundTask(withName:expirationHandler:)` | Call `endBackgroundTask(_:)` on every path; time left is in `backgroundTimeRemaining` and is set by the system |
| Refresh content so it is fresh at next open | `BGAppRefreshTask` | `earliestBeginDate` is a lower bound, not a schedule; system learns from usage |
| Long maintenance (DB cleanup, ML model update) | `BGProcessingTask` | Can set `requiresExternalPower` and `requiresNetworkConnectivity`; usually runs while charging and idle |
| Large upload/download that must survive suspension | Background `URLSession` (`URLSessionConfiguration.background(withIdentifier:)`) | Uploads must be from a file; transfers continue in a system daemon |
| Server-triggered refresh | Background push (`content-available: 1`, header `apns-push-type: background`, `apns-priority: 5`) | Throttled by the system; not delivered after the user force-quits the app |

3. Cross-platform mapping: React Native `expo-background-task` (Expo SDK 53+) or `react-native-background-fetch` use `BGTaskScheduler`; Flutter `workmanager` plugin uses `BGTaskScheduler` on iOS. The native `Info.plist` entries below are still required; read the plugin README for its identifier names.

### Output
Mechanism table for this app.

### Quality Gate
- Every job maps to one mechanism, and any "must run at exact intervals" requirement is recorded as not achievable on iOS.

---

## Phase 2: Register, Schedule and Handle Expiration

### Entry Criteria
- Phase 1 complete.

### Actions
1. `Info.plist`:
   - `BGTaskSchedulerPermittedIdentifiers` (array) containing each identifier, reverse-DNS, for example `com.shop.app.refresh`.
   - `UIBackgroundModes` containing `fetch` for app refresh tasks, `processing` for processing tasks, `remote-notification` for background push.
2. Register every identifier before `application(_:didFinishLaunchingWithOptions:)` returns:
```swift
BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.shop.app.refresh", using: nil) { task in
    handleRefresh(task as! BGAppRefreshTask)
}
```
   SwiftUI lifecycle alternative: `.backgroundTask(.appRefresh("com.shop.app.refresh")) { await refresh() }` on the `WindowGroup` scene (iOS 16+). Use one style, not both, per identifier.
3. Handler pattern:
```swift
func handleRefresh(_ task: BGAppRefreshTask) {
    scheduleRefresh()                                   // schedule the next one first
    let work = Task { let ok = await sync.run(); task.setTaskCompleted(success: ok) }
    task.expirationHandler = { work.cancel() }          // must stop quickly; the system is ending the task
}
func scheduleRefresh() {
    let r = BGAppRefreshTaskRequest(identifier: "com.shop.app.refresh")
    r.earliestBeginDate = Date(timeIntervalSinceNow: earliestSeconds)   // user input; a hint only
    do { try BGTaskScheduler.shared.submit(r) } catch { log(error) }
}
```
   Call `setTaskCompleted(success:)` exactly once on every path, including cancellation.
4. Call `scheduleRefresh()` also when the app enters background (`scenePhase == .background`).
5. Files the job reads must not use `NSFileProtectionComplete` (unreadable while locked); see `mob-ios-local-store`.
6. Do NOT use `UIApplication.setMinimumBackgroundFetchInterval` or `performFetchWithCompletionHandler` in new code; they are the deprecated background fetch API.

### Output
Registration, scheduling and handler code.

### Quality Gate
- `/usr/libexec/PlistBuddy -c "Print :BGTaskSchedulerPermittedIdentifiers" Info.plist` lists every identifier used in code (`grep -rn "forTaskWithIdentifier\|BGAppRefreshTaskRequest(identifier\|BGProcessingTaskRequest(identifier" <sources>`).
- Every handler path calls `setTaskCompleted` (count call sites and branches in the handler).

---

## Phase 3: Trigger on a Device and Check Limits

### Entry Criteria
- Phase 2 builds. A physical device is available: `BGTaskScheduler.submit` fails on the Simulator with `BGTaskSchedulerErrorCodeUnavailable`.

### Actions
1. Run on device from Xcode, send the app to background, pause in the debugger, and in the LLDB console run:
```
e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.shop.app.refresh"]
```
   Resume. Then test expiration with `_simulateExpirationForTaskWithIdentifier:`. These are private debugging selectors Apple documents for testing only; never ship code that calls them.
2. Check Console.app (device selected, filter by `dasd` or your subsystem) for scheduling and run logs.
3. Check conditions that stop background work and record the app's behavior for each: Settings > General > Background App Refresh off (`UIApplication.shared.backgroundRefreshStatus == .denied`), Low Power Mode on, app force-quit from the app switcher (no tasks until the user opens the app again).
4. Background `URLSession`: implement `application(_:handleEventsForBackgroundURLSession:completionHandler:)`, store the handler, call it in `urlSessionDidFinishEvents(forBackgroundURLSession:)` on the main queue.

### Output
`ios_background_plan`.

### Quality Gate
- Device log shows the handler ran and `setTaskCompleted(success: true)` was logged after the simulate-launch command.
- Expiration test shows cancellation and `setTaskCompleted(success: false)` with no crash.
- Each limiting condition in step 3 has a recorded app behavior.

---

## Worked Example

Illustrative only. Jobs: refresh order statuses (stale is fine), upload receipt photos (must finish), weekly cache cleanup.

Phase 1: refresh: `BGAppRefreshTask`; upload: background `URLSession` from files; cleanup: `BGProcessingTask` with `requiresExternalPower = true`.

Phase 3 device log after simulate-launch:
```
Simulating launch for task with identifier com.shop.app.refresh
[Sync] refresh started, 14 orders updated
[Sync] setTaskCompleted(success: true)
```
Background App Refresh off: banner "Order updates refresh when you open the app" shown; refresh happens at foreground.

---

## Exit Criteria

DONE when each job uses the one mechanism iOS allows for it, identifiers are in `Info.plist` and registered at launch, every path completes the task, and launch and expiration were triggered on a device.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Crash `No launch handler registered for task with identifier` | **Adjust**: registration happens after launch finished or the identifier is misspelled; register in `didFinishLaunching`. |
| Phase 2 | `submit` throws `BGTaskSchedulerErrorCodeNotPermitted` | **Adjust**: identifier missing from `BGTaskSchedulerPermittedIdentifiers` or the matching `UIBackgroundModes` entry is missing. |
| Phase 3 | Task never runs in normal use | **Return**: expected system behavior; the system decides timing. Report the observed delay, do not shorten `earliestBeginDate` to "fix" it. |
| Phase 3 | Watchdog kill on expiration | **Adjust**: the expiration handler blocks; make it only cancel work. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
