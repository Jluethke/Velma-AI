# iOS Unit and UI Tests With XCTest

**One-line description:** Adds unit tests (Swift Testing or XCTest) for the reducer, view model and network/store seams, and XCUITest UI tests that launch the app with stubbed state through launch arguments and query by accessibility identifier, runs them with `xcodebuild test` into an `.xcresult` bundle, reads results with `xcresulttool`, and checks for flakiness with `-test-iterations`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`; test cases and UI ids.
- `ios_screen_impl` (object, required): From `mob-ios-swiftui-screen`.

---

## Outputs

- `ios_test_report` (object): Test files added, `.xcresult` path, pass/fail counts per target, coverage percent of the screen files, flake run result.

---

## Phase 1: Unit Tests

### Entry Criteria
- `app_profile.stack` is `ios`; reducer tests from `ios_screen_impl` pass.

### Actions
1. Framework: Swift Testing (`import Testing`, `@Test`, `#expect`, `#require`) when Xcode is 16 or later; XCTest otherwise. Both can live in one target; do not convert existing XCTest files.
2. Add model tests with a fake API conforming to the same protocol: `Appear` with a fake returning items ends in `.content`; with a fake throwing `URLError(.notConnectedToInternet)` ends in `.error(.offline)`. For async waits on XCTest use `await fulfillment(of: [exp], timeout: t)` (Xcode 14.3+); never `sleep`.
3. Run only the unit target:
```bash
xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' \
  -only-testing:<UnitTarget> -resultBundlePath build/unit.xcresult -enableCodeCoverage YES
```
   Delete an existing `build/unit.xcresult` first; `xcodebuild` refuses to overwrite a result bundle.

### Output
Unit test files and `build/unit.xcresult`.

### Quality Gate
- `** TEST SUCCEEDED **`.
- `xcrun xccov view --report --only-targets build/unit.xcresult` prints coverage for the app target; record the percent for the screen's files (`xcrun xccov view --report build/unit.xcresult | grep Orders`). No coverage threshold is set here unless the project defines one.

---

## Phase 2: UI Tests With Stubbed State

### Entry Criteria
- Phase 1 passed. A UI test target exists, or create one (File > New > Target > UI Testing Bundle).

### Actions
1. App side: read `ProcessInfo.processInfo.arguments` at startup; when `-UITestState error` is present, inject the stub API that fails offline. Keep this code under `#if DEBUG`.
2. Test side:
```swift
final class OrdersUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testErrorThenRetryShowsContent() {
        let app = XCUIApplication()
        app.launchArguments += ["-UITestState", "errorThenContent"]
        app.launch()
        XCTAssertTrue(app.otherElements["orders.error"].waitForExistence(timeout: t))
        app.buttons["orders.retry"].tap()
        XCTAssertTrue(app.otherElements["orders.content"].waitForExistence(timeout: t))
    }
}
```
   `t` is a value the project already uses or the user chooses; record it. Query by the ids from `screen_state_machine`, never by visible text that localization changes.
3. One UI test per state plus one per user action that changes state.
4. Do NOT: add `sleep()`; tap by coordinate; use `XCTAssertTrue(true)`; mark a test as skipped to get green.
5. Run: `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' -only-testing:<UITestTarget> -resultBundlePath build/ui.xcresult`.

### Output
UI tests and `build/ui.xcresult`.

### Quality Gate
- `** TEST SUCCEEDED **`.
- `grep -rn "sleep(" <UITestTarget dir>` prints nothing.

---

## Phase 3: Read Results and Check Flakiness

### Entry Criteria
- Phase 2 ran.

### Actions
1. Summaries: Xcode 16 `xcrun xcresulttool get test-results summary --path build/ui.xcresult`; older Xcode `xcrun xcresulttool get --format json --path build/ui.xcresult`. Failure screenshots and logs: open the bundle in Xcode (`open build/ui.xcresult`).
2. Flake check on the new tests only:
```bash
xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' \
  -only-testing:<UITestTarget>/OrdersUITests -test-iterations <N> -run-tests-until-failure
```
   (`-test-iterations` and `-run-tests-until-failure` need Xcode 13+.) N is a user input; record it.
3. If a test fails intermittently, find the missing wait (an element queried before it exists) and fix the test or the app's accessibility identifiers. Do not add retries (`-retry-tests-on-failure`) to hide it.
4. Fill `ios_test_report`.

### Output
`ios_test_report`.

### Quality Gate
- `xcresulttool` summary shows `failedTests: 0` (or `"result" : "Passed"`) for both bundles.
- The flake run completed N iterations with zero failures.

---

## Worked Example

Illustrative only. Xcode 16.1, `iPhone 16` simulator, Orders screen.

Phase 1: 4 model tests added; `xccov` shows `OrdersModel.swift 91.2%`.

Phase 2: 5 UI tests. Phase 3:
```
$ xcrun xcresulttool get test-results summary --path build/ui.xcresult
{ "result" : "Passed", "totalTestCount" : 5, "passedTests" : 5, "failedTests" : 0, ... }
$ xcodebuild test ... -only-testing:ShopUITests/OrdersUITests -test-iterations 20 -run-tests-until-failure
** TEST SUCCEEDED **
```

---

## Exit Criteria

DONE when unit tests cover the model's state paths, UI tests cover every state by identifier with stubbed data, both result bundles report zero failures, and the flake run passed all iterations.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Unable to find a destination matching the provided destination specifier` | **Adjust**: pick a device from `xcrun simctl list devices available`. |
| Phase 1 | `Existing file at -resultBundlePath` | **Adjust**: delete the old bundle, rerun. |
| Phase 2 | Element not found | **Adjust**: print `app.debugDescription` in the test to see the tree; fix the identifier, not the query type guess. |
| Phase 3 | Fails only on CI | **Adjust**: CI simulator is slower or uses another locale; check waits and text queries. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
