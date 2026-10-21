# Flutter Widget and Integration Tests

**One-line description:** Adds widget tests that pump the screen with a fake repository and find widgets by `Key`, accessibility guideline checks, and `integration_test` end-to-end tests run on a real simulator or emulator, avoiding the `pumpAndSettle` timeout trap with progress indicators, and reports coverage from `lcov.info`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.
- `flutter_screen_impl` (object, required): From `mob-flutter-screen`.

---

## Outputs

- `flutter_test_report` (object): Test files, pass counts per suite, devices used, coverage line rate for the feature folder, flake run result.

---

## Phase 1: Widget Tests

### Entry Criteria
- `app_profile.stack` is `flutter`; reducer tests from `flutter_screen_impl` pass.

### Actions
1. Pump with injected fakes (Riverpod `ProviderScope(overrides: [...])`, Bloc `BlocProvider.value`, or constructor injection):
```dart
testWidgets('offline error then retry shows content', (tester) async {
  final api = FakeOrdersApi(failFirst: true);
  await tester.pumpWidget(ProviderScope(overrides: [ordersApiProvider.overrideWithValue(api)], child: const MaterialApp(home: OrdersPage())));
  await tester.pump();                        // run the first frame and microtasks
  expect(find.byKey(const Key('orders.error')), findsOneWidget);
  await tester.tap(find.byKey(const Key('orders.retry')));
  await tester.pump(); await tester.pump();   // loading frame, then result
  expect(find.byKey(const Key('orders.content')), findsOneWidget);
});
```
2. `pumpAndSettle()` waits until no frames are scheduled. An indeterminate `CircularProgressIndicator` animates forever, so `pumpAndSettle` times out in the `Loading` state. Use `pump()` or `pump(const Duration(milliseconds: x))` there.
3. Accessibility checks in the same file:
```dart
final handle = tester.ensureSemantics();
await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
await expectLater(tester, meetsGuideline(textContrastGuideline));
handle.dispose();
```
4. Golden tests only if the project already uses them. Never run `--update-goldens` to turn a failing test green without reviewing the image diff in `test/failures/`.
5. Run `flutter test test/features/orders --reporter expanded`.

### Output
Widget tests.

### Quality Gate
- Output ends with `All tests passed!`; each state key has a `find.byKey` assertion.

---

## Phase 2: Integration Tests on a Device

### Entry Criteria
- `flutter devices` lists at least one simulator/emulator/device.

### Actions
1. Add to `pubspec.yaml` `dev_dependencies`: `integration_test: sdk: flutter` and `flutter_test: sdk: flutter` (if missing), then `flutter pub get`.
2. `integration_test/orders_test.dart`:
```dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('orders retry flow', (tester) async {
    app.main(testOverrides: true);   // entry that wires the stub API; keep it out of release builds
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.byKey(const Key('orders.retry')));
    await tester.pump(const Duration(seconds: 1));
    expect(find.byKey(const Key('orders.content')), findsOneWidget);
  });
}
```
   A `testOverrides` parameter or a separate `lib/main_test.dart` entry point (`flutter test integration_test/orders_test.dart` imports it) are both fine; pick what the project already does.
3. Run per platform: `flutter test integration_test/orders_test.dart -d <deviceId>` using an id from `flutter devices`.
4. System dialogs (permissions, notifications) are outside Flutter's widget tree; `integration_test` cannot tap them. Use `patrol` only if already in the project, or pre-grant permissions (`xcrun simctl privacy`, `adb shell pm grant`).

### Output
Integration tests.

### Quality Gate
- Each run ends with `All tests passed!` per device id tested; record the ids.

---

## Phase 3: Coverage and Flake Check

### Entry Criteria
- Phases 1 and 2 passed.

### Actions
1. `flutter test --coverage` writes `coverage/lcov.info`. Line rate for the feature: `lcov --summary coverage/lcov.info` (if lcov is installed) or sum the `LH` (lines hit) and `LF` (lines found) records for the feature folder:
```bash
awk '/^SF:.*lib\/features\/orders/{f=1} /^end_of_record/{f=0} f&&/^LH:/{h+=substr($0,4)} f&&/^LF:/{l+=substr($0,4)} END{print h "/" l}' coverage/lcov.info
```
   No threshold unless the project defines one.
2. Flake: repeat `flutter test test/features/orders` N times (user input) in a loop, stop at the first failure.
3. Fill `flutter_test_report`.

### Output
`flutter_test_report`.

### Quality Gate
- Coverage number recorded with the command that produced it.
- N runs with no failure.

---

## Worked Example

Illustrative only. Riverpod, iPhone 16 Simulator and Android emulator `emulator-5554`.

Phase 1: first attempt used `pumpAndSettle()` after tap and failed with `pumpAndSettle timed out`; replaced with two `pump()` calls; 6 widget tests pass; tap target guideline flagged a 32x32 icon, fixed with `IconButton` constraints.

Phase 2:
```
$ flutter test integration_test/orders_test.dart -d emulator-5554
00:41 +1: All tests passed!
```

---

## Exit Criteria

DONE when widget tests cover every state and accessibility guidelines, integration tests pass on each target platform's device, coverage is recorded, and the flake loop is clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pumpAndSettle timed out` | **Adjust**: replace with `pump(duration)` while an animation runs. |
| Phase 1 | `A Timer is still pending even after the widget tree was disposed` | **Adjust**: cancel timers in `dispose` or advance time with `pump(duration)` before the test ends. |
| Phase 2 | `No devices found` | **Adjust**: boot a simulator (`open -a Simulator`) or emulator (`flutter emulators --launch <id>`). |
| Phase 2 | `MissingPluginException` | **Adjust**: plugins need a full app run on device; do not run integration tests with `flutter test` on the host without `-d`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
