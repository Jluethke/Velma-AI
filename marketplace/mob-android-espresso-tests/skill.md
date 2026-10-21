# Android Unit, Compose UI and Espresso Tests

**One-line description:** Adds JVM unit tests for the ViewModel with a test Main dispatcher, Compose UI tests (`createAndroidComposeRule`, `onNodeWithTag`) or Espresso tests for View screens with idling for async work, disables animations, optionally runs through Android Test Orchestrator or Gradle Managed Devices, and reads the Gradle XML and HTML reports.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.
- `android_screen_impl` (object, required): From `mob-android-compose-screen`.

---

## Outputs

- `android_test_report` (object): Test files, report paths, counts per task, flake run result.

---

## Phase 1: JVM Unit Tests

### Entry Criteria
- `app_profile.stack` is `android`; reducer tests from `android_screen_impl` pass.

### Actions
1. ViewModel tests with `kotlinx-coroutines-test`:
```kotlin
class MainDispatcherRule(val d: TestDispatcher = StandardTestDispatcher()) : TestWatcher() {
    override fun starting(description: Description) = Dispatchers.setMain(d)
    override fun finished(description: Description) = Dispatchers.resetMain()
}
@get:Rule val main = MainDispatcherRule()
@Test fun retry_fromOfflineError_showsContent() = runTest {
    val vm = OrdersViewModel(FakeRepo(failFirst = true), SavedStateHandle())
    vm.onEvent(OrdersEvent.Appear); advanceUntilIdle()
    assertEquals(OrdersUiState.Error(ErrorKind.Offline), vm.state.value)
    vm.onEvent(OrdersEvent.Retry); advanceUntilIdle()
    assertTrue(vm.state.value is OrdersUiState.Content)
}
```
   If Turbine is in `app_profile`, use `vm.state.test { awaitItem() }` to assert the sequence.
2. Run `./gradlew :app:testDebugUnitTest --tests "*Orders*"`.

### Output
Unit tests.

### Quality Gate
- `app/build/test-results/testDebugUnitTest/*.xml` for the new classes show `failures="0" errors="0"`.

---

## Phase 2: Instrumented UI Tests

### Entry Criteria
- An emulator or device is listed by `adb devices`.

### Actions
1. Choose by UI toolkit:

| Screen built with | Test API |
|---|---|
| Compose | `@get:Rule val rule = createAndroidComposeRule<MainActivity>()` (or `createComposeRule()` + `setContent { OrdersContent(state, {}) }` for a single composable) |
| Views | Espresso `onView(withId(R.id.retry)).perform(click())` with `ActivityScenarioRule` |

2. Compose test per state:
```kotlin
@Test fun errorState_retry_showsContent() {
    rule.onNodeWithTag("orders.error").assertIsDisplayed()
    rule.onNodeWithTag("orders.retry").performClick()
    rule.waitUntil(timeoutMillis = t) { rule.onAllNodesWithTag("orders.content").fetchSemanticsNodes().isNotEmpty() }
}
```
   Drive data through a fake repository injected with Hilt testing (`@HiltAndroidTest`, `HiltAndroidRule`, `@TestInstallIn`) or a test-only constructor; never through the real network.
3. Espresso with async work: register an `IdlingResource` (for example `CountingIdlingResource`) around background work, or Espresso proceeds before data arrives. Do not add `Thread.sleep`.
4. Disable animations: in `build.gradle.kts` `android { testOptions { animationsDisabled = true } }`, or on the device `adb shell settings put global window_animation_scale 0`, `transition_animation_scale 0`, `animator_duration_scale 0`.
5. Optional isolation: `testOptions { execution = "ANDROIDX_TEST_ORCHESTRATOR" }` with `androidTestUtil("androidx.test:orchestrator:<version>")` and runner argument `clearPackageData = "true"`; each test runs in its own process.
6. Run: `./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=<pkg>.OrdersScreenTest`.

### Output
UI tests.

### Quality Gate
- `BUILD SUCCESSFUL`; `app/build/outputs/androidTest-results/connected/**/TEST-*.xml` shows `failures="0"`.
- `grep -rn "Thread.sleep" app/src/androidTest` prints nothing.

---

## Phase 3: Report and Flake Check

### Entry Criteria
- Phase 2 ran.

### Actions
1. HTML reports: `app/build/reports/tests/testDebugUnitTest/index.html` and `app/build/reports/androidTests/connected/debug/index.html` (exact folder varies by AGP version; `find app/build/reports -name index.html`).
2. Flake check: repeat the class N times (user input) with a shell loop and stop on first failure:
```bash
for i in $(seq 1 "$N"); do ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=<pkg>.OrdersScreenTest -q || { echo "failed at $i"; break; }; done
```
3. Gradle Managed Devices (optional, AGP 7.3+) for a reproducible device: define under `testOptions.managedDevices` and run `./gradlew <deviceName>DebugAndroidTest`; see `mob-device-os-matrix`.
4. Fill `android_test_report`.

### Output
`android_test_report`.

### Quality Gate
- N iterations completed without "failed at" printed.
- Report paths recorded and counts match XML.

---

## Worked Example

Illustrative only. Compose screen, Hilt, emulator `Pixel_7_API_34`.

Phase 1: 3 ViewModel tests, XML `tests="3" failures="0"`.

Phase 2:
```
$ ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.shop.orders.OrdersScreenTest
Starting 5 tests on Pixel_7_API_34(AVD) - 14
Finished 5 tests on Pixel_7_API_34(AVD) - 14
BUILD SUCCESSFUL in 52s
```
Phase 3: N=10 chosen by the user; 10 runs, no failure.

---

## Exit Criteria

DONE when ViewModel tests and per-state UI tests pass, async waits use rules or idling resources, animations are off, and the flake loop passed N times.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Module with the Main dispatcher is missing` | **Adjust**: add `MainDispatcherRule`. |
| Phase 2 | `No compose hierarchies found in the app` | **Adjust**: the Activity did not call `setContent` before the assertion, or the wrong Activity was launched. |
| Phase 2 | `AppNotIdleException` / Espresso timeouts with infinite animation | **Adjust**: disable animations; replace an indeterminate progress indicator in tests with a static one via the fake state. |
| Phase 3 | Passes alone, fails in suite | **Adjust**: shared state between tests; enable Orchestrator with `clearPackageData` or reset the fake in `@Before`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
