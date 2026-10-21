# Android Background Work With WorkManager and Its Limits

**One-line description:** Maps each background job to WorkManager (one-time, periodic, expedited, long-running), a typed foreground service, or an exact alarm according to Android's documented limits (15-minute periodic minimum, Doze, App Standby buckets, Android 14 foreground service types), implements `CoroutineWorker`s with constraints, backoff and unique names, and proves them with `work-testing` and `adb` Doze and job commands.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `background_jobs` (object[], required): Each job: purpose, trigger, network/charging needs, how late it may run, whether the user started it and watches it.

---

## Outputs

- `android_background_plan` (object): Per job: mechanism, request type, constraints, backoff, unique work name and policy, manifest entries, test and adb results.

---

## Phase 1: Choose a Mechanism per Job

### Entry Criteria
- `app_profile.stack` is `android`, `react-native` or `flutter`.

### Actions
1. Apply:

| Job | Mechanism | Documented limits |
|---|---|---|
| Deferrable, must eventually run (sync, upload queue) | `OneTimeWorkRequest` with constraints | Survives reboot; runs when constraints are met |
| Repeating | `PeriodicWorkRequest` | Minimum interval 15 minutes (`PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS`); timing is inexact |
| Short, user-initiated, should start now | `setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)` | Quota-limited; below API 31 runs as a foreground service, so the worker must implement `getForegroundInfo()` |
| Longer than the 10-minute worker execution limit, user-visible | Long-running worker via `setForeground(ForegroundInfo(...))` | Needs a notification and, on API 34+, a foreground service type |
| Must fire at an exact clock time (alarm clock, calendar reminder) | `AlarmManager.setExactAndAllowWhileIdle` | API 31+: needs `SCHEDULE_EXACT_ALARM` (user-revocable, check `canScheduleExactAlarms()`) or `USE_EXACT_ALARM` (Play-restricted) |
| Ongoing user-visible activity (navigation, call, media) | Foreground service with `android:foregroundServiceType` | API 34+: type required plus `FOREGROUND_SERVICE_<TYPE>` permission; API 31+ restricts starting from background |

2. Cross-platform mapping: Flutter `workmanager` plugin and React Native `expo-background-task` / `react-native-background-fetch` schedule through WorkManager or JobScheduler; the same limits apply.
3. Record OEM battery managers as a known limit (some vendors stop background work beyond stock Android); test on the vendors in `mob-device-os-matrix`.

### Output
Mechanism table.

### Quality Gate
- No periodic job has an interval below 15 minutes.
- Every API 34+ foreground use names its `foregroundServiceType` and matching permission.

---

## Phase 2: Implement Workers

### Entry Criteria
- Phase 1 complete; `androidx.work:work-runtime-ktx` present or approved.

### Actions
1. Worker:
```kotlin
class OutboxWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = try {
        outbox.drain()                 // idempotent: safe to run twice
        Result.success()
    } catch (e: IOException) {
        if (runAttemptCount + 1 >= maxAttempts) Result.failure() else Result.retry()
    }
}
```
   With Hilt use `@HiltWorker` and `@AssistedInject`, and provide `HiltWorkerFactory` through `Configuration.Provider`; remove the default initializer in the manifest as the WorkManager docs describe.
2. Request:
```kotlin
val req = OneTimeWorkRequestBuilder<OutboxWorker>()
    .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, backoffSeconds, TimeUnit.SECONDS)   // WorkManager default: exponential, 30 s (WorkRequest.DEFAULT_BACKOFF_DELAY_MILLIS)
    .build()
WorkManager.getInstance(ctx).enqueueUniqueWork("outbox", ExistingWorkPolicy.KEEP, req)
```
   Periodic: `enqueueUniquePeriodicWork("refresh", ExistingPeriodicWorkPolicy.UPDATE, periodicReq)` (`UPDATE` exists from WorkManager 2.8; earlier use `KEEP`). Never `enqueue()` a periodic request at every app start without a unique name; that stacks duplicates.
3. Work must be idempotent: the system can run it again after a process kill.
4. Do NOT start a foreground service from the background to dodge limits; API 31+ throws `ForegroundServiceStartNotAllowedException`.

### Output
Workers and enqueue calls.

### Quality Gate
- `grep -rn "\.enqueue(" app/src/main | grep -i periodic` prints nothing (periodic work only via `enqueueUniquePeriodicWork`).
- `./gradlew :app:assembleDebug` exits 0.

---

## Phase 3: Test With work-testing and adb

### Entry Criteria
- Phase 2 builds.

### Actions
1. Unit test the worker body with `TestListenableWorkerBuilder<OutboxWorker>(context).setRunAttemptCount(n).build().doWork()`; assert `Result.retry()` on `IOException` and `Result.failure()` at the attempt limit.
2. Instrumented: `WorkManagerTestInitHelper.initializeTestWorkManager(context, Configuration.Builder().setExecutor(SynchronousExecutor()).build())`; enqueue; `WorkManagerTestInitHelper.getTestDriver(context)!!.setAllConstraintsMet(req.id)`; assert `WorkInfo.State.SUCCEEDED`. For periodic work call `setPeriodDelayMet(id)`.
3. On an emulator or device:
```bash
adb shell am broadcast -a "androidx.work.diagnostics.REQUEST_DIAGNOSTICS" -p "<pkg>"   # WorkManager 2.4+; then:
adb logcat -s WM-DiagnosticsWrkr
adb shell dumpsys jobscheduler | grep -A5 "<pkg>"
adb shell cmd jobscheduler run -f <pkg> <jobId>       # force a job by id shown in dumpsys
adb shell dumpsys deviceidle force-idle                # enter Doze
adb shell am set-standby-bucket <pkg> rare             # simulate a rarely used app
adb shell am get-standby-bucket <pkg>
adb shell dumpsys deviceidle unforce; adb shell dumpsys battery reset
```
   Record when work ran in each condition. Android Studio App Inspection > Background Task Inspector shows the same live.
4. Force-stop check: Settings > Apps > Force stop cancels scheduled work until the user opens the app again; record it as a known limit.

### Output
`android_background_plan`.

### Quality Gate
- Unit and instrumented tests pass (`BUILD SUCCESSFUL`, `failures="0"`).
- The diagnostics log lists every unique work name with the expected state.
- Doze and `rare` bucket results are recorded per job.

---

## Worked Example

Illustrative only. Jobs: drain outbox (from `mob-android-okhttp-offline`), refresh orders every 6 h (product choice), user-started 200 MB video upload.

Phase 1: outbox: unique one-time, CONNECTED; refresh: unique periodic 6 h; upload: long-running worker with `setForeground`, type `dataSync`, permission `FOREGROUND_SERVICE_DATA_SYNC`.

Phase 3:
```
$ adb logcat -s WM-DiagnosticsWrkr
WM-DiagnosticsWrkr: Recently completed work:
WM-DiagnosticsWrkr:  Id  Class Name  Job Id  State  Unique Name  Tags
WM-DiagnosticsWrkr:  1f2e...  com.shop.sync.OutboxWorker  12  SUCCEEDED  outbox  ...
```
In `force-idle`, the outbox ran at the next maintenance window after `unforce` (recorded).

---

## Exit Criteria

DONE when each job uses the mechanism Android allows for it, periodic work is unique and at least 15 minutes, foreground use is typed, workers are idempotent with backoff, and tests plus adb runs show behavior under Doze and standby buckets.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `IllegalStateException: WorkManager is already initialized` | **Adjust**: remove the default `WorkManagerInitializer` from the merged manifest when using a custom `Configuration.Provider`. |
| Phase 2 | `MissingForegroundServiceTypeException` on API 34 | **Adjust**: add the type in the manifest and in `ForegroundInfo`. |
| Phase 3 | Periodic work runs many times in parallel | **Adjust**: replace `enqueue` with `enqueueUniquePeriodicWork`; cancel old work by tag once. |
| Phase 3 | Work never runs on an OEM device | **Return**: record the vendor limit; do not add wake locks or fake foreground services. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
