# Mobile Screen State Machine

**One-line description:** Turns one screen's spec into a closed state machine (states, events, a full transition table, side effects, and what survives process death) that rules out impossible states like "loading and error at once", and derives one test case per transition for the platform flows to implement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_spec` (object, required): Screen name, the data it shows and where that data comes from (endpoint, local table), the user actions on it, and design states provided by design (empty, error, offline).

---

## Outputs

- `screen_state_machine` (object): `states` (name, payload fields), `events`, `initial_state`, `transitions` (every state x event cell: target state or `ignored`), `effects` (per transition), `restoration` (fields saved across process death), `announcements` (text a screen reader speaks on entering each state), and `test_cases`.

---

## Phase 1: Enumerate States and Events

### Entry Criteria
- `screen_spec` names at least one data source and one user action.

### Actions
1. Start from this state set and delete a state only if `screen_spec` proves it cannot happen:

| State | Payload | Enter when |
|---|---|---|
| `Loading` | none | first load, no cached data |
| `Content` | items, `isRefreshing: Bool`, `isStale: Bool` | data available (fresh or cached) |
| `Empty` | none | source returned zero items |
| `Error` | `kind` (`offline`, `timeout`, `server`, `unauthorized`, `unknown`) | load failed and no cached data |

   Do NOT model state as separate booleans (`isLoading`, `error`, `items`). Four booleans allow 16 combinations, most of them invalid. One tagged value (Swift enum with associated values, Kotlin sealed interface, TypeScript discriminated union, Dart sealed class) allows only the rows above.
2. Refresh keeps old content visible: refreshing is `Content(isRefreshing=true)`, never a return to `Loading`.
3. Offline with cache is `Content(isStale=true)`, not `Error`. Offline without cache is `Error(kind=offline)`.
4. List events: `Appear`, `Refresh`, `Retry`, `LoadSucceeded(items)`, `LoadFailed(kind)`, `ConnectivityRestored`, plus one event per user action in `screen_spec` (for example `DeleteTapped(id)`).

### Output
State list and event list.

### Quality Gate
- No state has two payload fields that contradict each other (for example items present and error kind present).
- Every user action in `screen_spec` maps to exactly one event.

---

## Phase 2: Fill the Transition Table

### Entry Criteria
- Phase 1 complete.

### Actions
1. Build a table with one row per state and one column per event. Every cell holds either a target state plus effect, or the word `ignored`. No blank cells.
2. Apply these fixed rules:
   - `Retry` is accepted only in `Error`. In other states it is `ignored`.
   - `LoadSucceeded` with zero items goes to `Empty`; with items goes to `Content(isRefreshing=false, isStale=false)`.
   - `LoadFailed` while in `Content` stays in `Content` with `isRefreshing=false` and emits a one-shot message effect (snackbar/toast); it never wipes the content.
   - `ConnectivityRestored` triggers a reload only from `Error(kind=offline)` or `Content(isStale=true)`.
   - `Refresh` while `isRefreshing=true` is `ignored` (no duplicate requests).
3. Effects are named, not coded: `load`, `cancelLoad`, `showMessage(text)`, `navigate(route)`. The view layer runs effects; the transition function only returns them. This keeps the transition function pure and unit-testable on every stack.
4. Leaving the screen emits `cancelLoad`. Record which effect cancels each in-flight request.
5. Restoration after the OS kills the process in the background: list only small fields (selected id, scroll anchor, search text, form input). Never restore `Loading` or a network result; reload instead. Name the platform mechanism: Android `SavedStateHandle`, SwiftUI `@SceneStorage`, React Navigation persisted state, Flutter `RestorationMixin`.
6. Write the `announcements` column: the sentence VoiceOver/TalkBack speaks when entering `Empty`, `Error`, and when a refresh fails while content stays.

### Output
Transition table, effects, restoration, announcements.

### Quality Gate
- Count of cells equals (number of states) x (number of events), with zero blanks.
- Every state is reachable from `initial_state`: do a breadth-first walk over non-ignored cells and list the visited set; it equals the state list.
- No transition goes from `Content` to `Loading`.

---

## Phase 3: Derive Test Cases

### Entry Criteria
- Phase 2 gates passed.

### Actions
1. Write one test case per non-ignored cell: `given <state>, when <event>, then <state> and effects <list>`.
2. Add one test per `ignored` cell for `Retry` and `Refresh` (these are where duplicate requests come from).
3. Add one UI test per state that asserts the visible element for it, using stable ids: `<screen>.loading`, `<screen>.content`, `<screen>.empty`, `<screen>.error`, `<screen>.retry`. The platform flows use these exact ids as `accessibilityIdentifier`, `testTag`, `testID` or `Key`.
4. Emit `screen_state_machine` as JSON.

### Output
`screen_state_machine`.

### Quality Gate
- Number of transition test cases equals the number of non-ignored cells.
- Each state has one UI test id.
- The JSON parses: `python -m json.tool screen_state_machine.json` exits 0.

---

## Worked Example

Illustrative only. `screen_spec`: "Orders list, data from `GET /v1/orders`, cached in local table `orders`, actions: pull to refresh, tap order, cancel order."

Phase 1: states `Loading`, `Content(items,isRefreshing,isStale)`, `Empty`, `Error(kind)`. Events: `Appear`, `Refresh`, `Retry`, `LoadSucceeded`, `LoadFailed`, `ConnectivityRestored`, `OrderTapped(id)`, `CancelTapped(id)`.

Phase 2 (excerpt):

| State \ Event | Refresh | LoadFailed(kind) | Retry |
|---|---|---|---|
| Loading | ignored | Error(kind) | ignored |
| Content | Content(isRefreshing=true) + load | Content(isRefreshing=false) + showMessage | ignored |
| Empty | Loading + load | Error(kind) | ignored |
| Error | Loading + load | Error(kind) | Loading + load |

4 states x 8 events = 32 cells, 0 blank. Walk from `Loading` visits all 4 states.

Phase 3: 21 non-ignored cells give 21 transition tests; UI ids `orders.loading`, `orders.content`, `orders.empty`, `orders.error`, `orders.retry`.

---

## Exit Criteria

DONE when every state x event cell is filled, every state is reachable, effects are named, restoration fields are listed with their platform mechanism, and the test case count equals the non-ignored cell count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `screen_spec` lacks an error or empty design | **Adjust**: keep the state, mark its UI as an open design question; do not drop the state. |
| Phase 2 | A cell seems to need two different targets | **Adjust**: split the event (for example `LoadFailed` into `LoadFailedWithCache` and `LoadFailed`) so each cell has one target. |
| Phase 2 | A state is unreachable | **Adjust**: add the missing transition or delete the state, then rerun the walk. |
| Phase 3 | Test count does not match cell count | **Retry**: recount from the table; do not round. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
