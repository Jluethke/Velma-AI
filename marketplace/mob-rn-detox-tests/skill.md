# React Native Jest and Detox Tests

**One-line description:** Adds Jest component tests with React Native Testing Library and gray-box end-to-end tests with Detox (`.detoxrc.js` app and device configurations, `detox build`, `detox test`, `by.id` matchers on the screen's `testID`s, artifacts on failure), and debugs Detox synchronization hangs instead of adding sleeps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.
- `rn_screen_impl` (object, required): From `mob-rn-screen`.

---

## Outputs

- `rn_test_report` (object): Jest and Detox test files, configuration names used, pass/fail per platform, artifact folder, flake run result.

---

## Phase 1: Component Tests in Jest

### Entry Criteria
- `app_profile.stack` is `react-native`; reducer tests from `rn_screen_impl` pass.

### Actions
1. If `@testing-library/react-native` is absent, ask before adding it (`npm i -D @testing-library/react-native`).
2. Test each state renders its id:
```tsx
it('shows retry on offline error and reloads', async () => {
  const api = { fetchOrders: jest.fn().mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce([order]) };
  render(<OrdersScreen api={api} />);
  expect(await screen.findByTestId('orders.error')).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('orders.retry'));
  expect(await screen.findByTestId('orders.content')).toBeOnTheScreen();
  expect(api.fetchOrders).toHaveBeenCalledTimes(2);
});
```
   `toBeOnTheScreen` comes from the library's built-in matchers (v12.4+) or `@testing-library/jest-native` on older versions.
3. Run `npx jest src/screens/orders`.

### Output
Component tests.

### Quality Gate
- Jest prints no failed tests; each state id has one `findByTestId`/`getByTestId` assertion.

---

## Phase 2: Detox Setup

### Entry Criteria
- Phase 1 passed. Xcode with a Simulator and/or an Android emulator AVD exists (`xcrun simctl list devices available`, `emulator -list-avds`).
- Expo managed apps: run `npx expo prebuild` first or use the Detox plugin for Expo per Detox docs; Detox needs native projects.

### Actions
1. Install if missing: `npm i -D detox jest` and `npx detox init` (creates `.detoxrc.js` and `e2e/jest.config.js`).
2. `.detoxrc.js` (names in angle brackets come from your project):
```js
module.exports = {
  testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
  apps: {
    'ios.debug': { type: 'ios.app', binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/<App>.app',
      build: 'xcodebuild -workspace ios/<App>.xcworkspace -scheme <App> -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build' },
    'android.debug': { type: 'android.apk', binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..' },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: '<device from simctl list>' } },
    emulator: { type: 'android.emulator', device: { avdName: '<avd from emulator -list-avds>' } },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
  },
};
```
3. Android native setup is required once (Detox Android guide): `androidTestImplementation('com.wix:detox:+')` in `android/app/build.gradle`, `testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"`, a `DetoxTest.java` under `android/app/src/androidTest/java/<package>/`, and a network security config allowing cleartext to `10.0.2.2` and `localhost` for debug only. Copy these from the Detox docs for your Detox major version; do not invent class names.
4. Debug configurations load JS from Metro: start `npx react-native start` (or `npx expo start`) before `detox test`. Release configurations bundle JS and need no Metro.

### Output
Detox configuration.

### Quality Gate
- `npx detox build -c ios.sim.debug` (and/or `-c android.emu.debug`) exits 0 and the `binaryPath` file exists.

---

## Phase 3: Write and Run E2E Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Test:
```js
describe('Orders', () => {
  beforeAll(async () => { await device.launchApp({ newInstance: true, launchArgs: { uiTestState: 'errorThenContent' } }); });
  it('retries from error to content', async () => {
    await expect(element(by.id('orders.error'))).toBeVisible();
    await element(by.id('orders.retry')).tap();
    await waitFor(element(by.id('orders.content'))).toBeVisible().withTimeout(t);
  });
});
```
   Read `launchArgs` in the app with `react-native-launch-arguments` or the Detox-recommended approach, and switch to a stub API in debug builds only. `t` is a recorded user choice.
2. Permissions without dialogs: `device.launchApp({ permissions: { camera: 'YES', notifications: 'YES' } })` (iOS).
3. Run with artifacts:
```bash
npx detox test -c ios.sim.debug --record-logs failing --take-screenshots failing
npx detox test -c android.emu.debug --record-logs failing --take-screenshots failing
```
   Artifacts land in `artifacts/`.
4. Hang at "app is busy": run with `--debug-synchronization <ms>` to log what Detox waits on (timers, animations, network). Fix the source (looping animation, polling timer) or use `device.disableSynchronization()` around that one step with a written reason. Do NOT add `await new Promise(r => setTimeout(r, ...))`.
5. Flake check: run the file N times (user input); do not rely on `--retries` to pass.

### Output
`rn_test_report`.

### Quality Gate
- `detox test` ends with `Tests: N passed` and zero failed for each configured platform.
- `grep -rn "setTimeout" e2e/` prints nothing.

---

## Worked Example

Illustrative only. React Native 0.76, Detox 20, iPhone 16 Simulator and `Pixel_7_API_34`.

Phase 2: `npx detox build -c ios.sim.debug` exit 0.

Phase 3:
```
$ npx detox test -c ios.sim.debug --record-logs failing --take-screenshots failing
 PASS  e2e/orders.test.js (24.1 s)
  Orders
    ✓ retries from error to content (3412 ms)
Tests:       1 passed, 1 total
```
Android first run hung; `--debug-synchronization 500` showed a repeating `Animated.loop` on the skeleton loader; the stub state now renders a static skeleton under Detox, and the run passed.

---

## Exit Criteria

DONE when Jest covers each state's render, Detox builds and passes on every target platform with stubbed data, failures produce artifacts, and synchronization issues are fixed at the source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Failed to find a device by type = "iPhone 15"` | **Adjust**: use a type from `xcrun simctl list devicetypes`. |
| Phase 2 | Android build fails on `DetoxTest` | **Adjust**: package name in `DetoxTest.java` must match `applicationId` namespace. |
| Phase 3 | `Test Failed: ... Cannot find UI element` | **Adjust**: `testID` missing on a wrapped component; pass it through to a native view. |
| Phase 3 | App shows red screen "Could not connect to development server" | **Adjust**: start Metro or use a release configuration. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
