# Flutter Screen From a State Machine

**One-line description:** Implements one Flutter screen with a Dart 3 `sealed class` state, a pure reducer using exhaustive `switch` patterns, the state holder the project already uses (Riverpod `Notifier`, `Bloc`, or `ValueNotifier`), cancellation-safe async effects, and `Key`s that widget and integration tests find.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`; read `libraries.state` and the Dart SDK constraint.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.

---

## Outputs

- `flutter_screen_impl` (object): Paths of the state/reducer file, state holder, widget; `flutter analyze` and `flutter test` results.

---

## Phase 1: Sealed State and Pure Reducer

### Entry Criteria
- `app_profile.stack` is `flutter`.
- `pubspec.yaml` `environment: sdk:` lower bound is 3.0.0 or higher (sealed classes and patterns). If lower, **Stop** and report.

### Actions
1. Create `lib/features/orders/orders_state.dart`:
```dart
sealed class OrdersState { const OrdersState(); }
final class Loading extends OrdersState { const Loading(); }
final class Content extends OrdersState {
  const Content(this.items, {this.isRefreshing = false, this.isStale = false});
  final List<Order> items; final bool isRefreshing; final bool isStale;
}
final class Empty extends OrdersState { const Empty(); }
final class Failed extends OrdersState { const Failed(this.kind); final ErrorKind kind; }

sealed class OrdersEvent { const OrdersEvent(); }
// Appear, Refresh, Retry, LoadSucceeded(items), LoadFailed(kind) ...
enum OrdersEffect { load, cancelLoad }

(OrdersState, List<OrdersEffect>) reduce(OrdersState s, OrdersEvent e) => switch ((s, e)) {
  (Failed(), Retry()) => (const Loading(), [OrdersEffect.load]),
  (Content(isRefreshing: false) && final c, Refresh()) =>
      (Content(c.items, isRefreshing: true, isStale: c.isStale), [OrdersEffect.load]),
  // one arm per non-ignored cell
  _ => (s, const []),   // ignored cells, listed in a comment
};
```
   Name the error state `Failed`, not `Error`, to avoid clashing with `dart:core` `Error`.
2. Implement value equality (`==` and `hashCode`) or use the `equatable`/`freezed` package if already in `pubspec.yaml`; tests compare states.
3. This file imports only `package:meta` or model files, never `package:flutter`.

### Output
`orders_state.dart`.

### Quality Gate
- `flutter analyze lib/features/orders` prints `No issues found!`.
- `grep -c "package:flutter" lib/features/orders/orders_state.dart` prints 0.

---

## Phase 2: State Holder and Widget

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose the holder from `app_profile.libraries.state`:

| Present | Holder |
|---|---|
| `flutter_riverpod` / `hooks_riverpod` | `class OrdersNotifier extends Notifier<OrdersState>`; `ref.onDispose` cancels work |
| `flutter_bloc` | `class OrdersBloc extends Bloc<OrdersEvent, OrdersState>` with `on<E>` handlers that call `reduce` |
| none | `class OrdersController extends ValueNotifier<OrdersState>` owned by a `StatefulWidget`, disposed in `dispose()` |

2. Holder method `send(OrdersEvent e)`: call `reduce`, assign state, run effects. For `load`, keep a generation counter; when a response arrives, drop it if the counter changed (Dart `Future`s cannot be cancelled, so ignore stale results):
```dart
int _gen = 0;
Future<void> _load() async {
  final my = ++_gen;
  try { final items = await api.fetchOrders(); if (my == _gen) send(LoadSucceeded(items)); }
  catch (e) { if (my == _gen) send(LoadFailed(ErrorKind.from(e))); }
}
```
3. Widget: `switch (state)` expression returning one widget per class; `RefreshIndicator(onRefresh: ...)` around the list. Add `key: const Key('orders.error')` and the other ids from `screen_state_machine.test_cases`.
4. After any `await` in a widget, check `if (!context.mounted) return;` before using `context`.
5. Do NOT: call `setState` from the holder; keep a `BuildContext` in the holder; add `// ignore:` comments to silence `use_build_context_synchronously`.

### Output
Holder and widget files.

### Quality Gate
- `flutter analyze` prints `No issues found!` (or the same issue count as baseline).
- `dart format --output=none --set-exit-if-changed lib/features/orders` exits 0.

---

## Phase 3: Reducer Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Create `test/features/orders/orders_state_test.dart` with one `test()` per case in `screen_state_machine.test_cases`, asserting state and effects.
2. Run `flutter test test/features/orders`.

### Output
`flutter_screen_impl`.

### Quality Gate
- Output ends with `All tests passed!` and the `+N` counter equals the case count.

---

## Worked Example

Illustrative only. Orders screen, `flutter_riverpod: ^2.5.1`.

Phase 1: `flutter analyze lib/features/orders` prints `No issues found! (ran in 1.9s)`.

Phase 2: `OrdersNotifier extends Notifier<OrdersState>`, generation counter drops a late response after a quick refresh.

Phase 3:
```
$ flutter test test/features/orders
00:02 +23: All tests passed!
```

---

## Exit Criteria

DONE when the sealed state and reducer cover every non-ignored cell, the holder matches the project's state library, late responses are dropped, and analyze, format and tests are clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `The type 'OrdersState' isn't exhaustively matched` | **Adjust**: add the missing arm. |
| Phase 1 | SDK lower bound below 3.0 | **Stop**: sealed classes need Dart 3; report the upgrade as a prerequisite. |
| Phase 2 | `setState() called after dispose()` | **Adjust**: dispose the `ValueNotifier` and check `mounted`/generation before sending. |
| Phase 3 | Equality failures on identical-looking states | **Adjust**: add `==`/`hashCode` or use the existing `equatable`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
