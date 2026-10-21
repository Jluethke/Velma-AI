# SwiftUI Screen From a State Machine

**One-line description:** Implements one screen in SwiftUI as a `@MainActor` model holding a single enum state, a pure `reduce` function that encodes the transition table, effects run with structured concurrency through `.task` and `.refreshable`, one `#Preview` per state, and accessibility identifiers that the UI tests use.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`; `ios_deployment_target` decides the observation API.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.

---

## Outputs

- `ios_screen_impl` (object): Paths of the state/reducer file, model file and view file; the observation API used; build exit code; reducer unit test file path and result.

---

## Phase 1: Choose the Observation API and Write the State Type

### Entry Criteria
- `app_profile.stack` is `ios`.
- `app_profile.build_cmd` exited 0 at baseline.

### Actions
1. Choose the model style from the deployment target. Do not mix both styles in one screen.

| `ios_deployment_target` | Model style | View owns model with |
|---|---|---|
| 17.0 or higher | `@Observable final class` (Observation framework) | `@State private var model = ...` |
| below 17.0 | `final class ...: ObservableObject` with `@Published private(set) var state` | `@StateObject private var model = ...` |

   Never use `@ObservedObject` for a model the view creates; SwiftUI can recreate it on every parent redraw and you lose state.
2. Create `<Screen>State.swift` containing only value types and the pure reducer. Map each state from `screen_state_machine.states` to one enum case:
```swift
enum OrdersState: Equatable {
    case loading
    case content(items: [Order], isRefreshing: Bool, isStale: Bool)
    case empty
    case error(ErrorKind)
}
enum OrdersEvent: Equatable { case appear, refresh, retry, loadSucceeded([Order]), loadFailed(ErrorKind), connectivityRestored }
enum OrdersEffect: Equatable { case load, cancelLoad, showMessage(String) }

func reduce(_ state: OrdersState, _ event: OrdersEvent) -> (OrdersState, [OrdersEffect]) {
    switch (state, event) {
    case (.error, .retry): return (.loading, [.load])
    case (.content(let items, false, let stale), .refresh):
        return (.content(items: items, isRefreshing: true, isStale: stale), [.load])
    // one case per non-ignored cell of the transition table
    default: return (state, [])   // the ignored cells
    }
}
```
3. Write exactly one `case` per non-ignored cell. The `default` branch is allowed only for `ignored` cells; list those cells in a comment above it.

### Output
`<Screen>State.swift` with the reducer.

### Quality Gate
- Number of `case (` lines in `reduce` equals the number of non-ignored cells (`grep -c "case (" <Screen>State.swift`).
- The file imports nothing except `Foundation`.

---

## Phase 2: Write the Model and View

### Entry Criteria
- Phase 1 file compiles: run `app_profile.build_cmd`, exit 0.

### Actions
1. Model (`<Screen>Model.swift`), marked `@MainActor` so every state write happens on the main actor:
```swift
@MainActor @Observable final class OrdersModel {
    private(set) var state: OrdersState = .loading
    private let api: OrdersAPI            // protocol, injected; never a singleton call inside
    private var loadTask: Task<Void, Never>?
    init(api: OrdersAPI) { self.api = api }

    func send(_ event: OrdersEvent) {
        let (next, effects) = reduce(state, event)
        state = next
        for effect in effects { run(effect) }
    }
    private func run(_ effect: OrdersEffect) {
        switch effect {
        case .load:
            loadTask?.cancel()
            loadTask = Task { [api] in
                do { let items = try await api.fetchOrders(); send(.loadSucceeded(items)) }
                catch is CancellationError { }
                catch { send(.loadFailed(ErrorKind(error))) }
            }
        case .cancelLoad: loadTask?.cancel()
        case .showMessage: break   // surfaced through a separate one-shot property
        }
    }
}
```
2. View: `switch model.state` with one branch per case. Attach `.task { model.send(.appear) }` to the root (SwiftUI cancels it when the view disappears) and `.onDisappear { model.send(.leave) }` only if the table has a leave event. Use `.refreshable { model.send(.refresh) }` on the `List`.
3. Set identifiers from `screen_state_machine.test_cases`: `.accessibilityIdentifier("orders.error")` on each state's root and on the retry button.
4. Add `#Preview("Error") { OrdersView(model: .preview(.error(.offline))) }` for every state, using a stub `OrdersAPI`.
5. Do NOT: start a `Task` in `init`; call `DispatchQueue.main.async` to fix a warning (fix the actor isolation instead); add `@unchecked Sendable` to silence the compiler; edit files outside this screen.

### Output
Model and view files.

### Quality Gate
- `app_profile.build_cmd` exits 0 with zero new warnings containing `Publishing changes from background threads` or `main actor-isolated` (`grep -c` on the build log prints 0).
- One `#Preview` exists per state (`grep -c "#Preview" <Screen>View.swift` equals the state count).

---

## Phase 3: Unit-Test the Reducer

### Entry Criteria
- Phase 2 builds.

### Actions
1. Create `<Screen>ReducerTests.swift` in the unit test target. Use Swift Testing (`import Testing`, `@Test`, `#expect`) when Xcode is 16 or later (from `app_profile`), otherwise XCTest.
2. One test per entry in `screen_state_machine.test_cases`, table-driven:
```swift
@Test(arguments: [
  (OrdersState.error(.offline), OrdersEvent.retry, OrdersState.loading, [OrdersEffect.load]),
])
func transition(_ s: OrdersState, _ e: OrdersEvent, _ want: OrdersState, _ fx: [OrdersEffect]) {
    let (got, effects) = reduce(s, e)
    #expect(got == want); #expect(effects == fx)
}
```
3. Run only these tests: `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' -only-testing:<UnitTarget>/<Screen>ReducerTests`.

### Output
`ios_screen_impl`.

### Quality Gate
- The test run prints `** TEST SUCCEEDED **`.
- Executed test count in the log equals the test case count.

---

## Worked Example

Illustrative only. Orders screen, `ios_deployment_target=16.0`, so `ObservableObject` + `@StateObject`.

Phase 1: `OrdersState.swift`, `grep -c "case (" OrdersState.swift` prints `21`, matching 21 non-ignored cells.

Phase 2: build log `grep -c "main actor-isolated" build.log` prints `0`; 4 previews.

Phase 3:
```
$ xcodebuild test -scheme Shop -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:ShopTests/OrdersReducerTests
Test Suite 'OrdersReducerTests' passed ... Executed 23 tests, with 0 failures
** TEST SUCCEEDED **
```
(21 transitions plus 2 ignored-cell tests.)

---

## Exit Criteria

DONE when the reducer has one case per non-ignored cell, the screen builds with no actor-isolation warnings, every state has a preview and identifier, and the reducer tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `@Observable` used with target below 17 (`'Observable()' is only available in iOS 17.0`) | **Adjust**: switch to `ObservableObject` per the table. |
| Phase 2 | `Main actor-isolated property 'state' can not be mutated from a Sendable closure` | **Adjust**: mark the model `@MainActor`; do not wrap in `DispatchQueue.main`. |
| Phase 2 | Previews fail to build | **Adjust**: give the stub API a default empty result; previews must not hit the network. |
| Phase 3 | A transition test fails | **Adjust**: fix `reduce` to match the table; never edit the expected value to match the code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
