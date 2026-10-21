# Android Font Scaling and TalkBack

**One-line description:** Makes one screen work at the largest font scale (Android 14 nonlinear scaling up to 200 percent) and with TalkBack (content descriptions, merged semantics, headings, live regions, 48 dp touch targets), then proves it with Compose or Espresso accessibility checks, lint, Accessibility Scanner and a scripted TalkBack pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.

---

## Outputs

- `android_a11y_report` (object): Per state: screenshot at largest font scale, TalkBack reading order, automated check findings fixed or open with reason.

---

## Phase 1: Font Scaling

### Entry Criteria
- `app_profile.stack` is `android`, `react-native` or `flutter`.

### Actions
1. Find text sized in non-scaling units:

| Stack | Search | Fix |
|---|---|---|
| Compose | `grep -nE "fontSize = .*dp" <screen files>` and `grep -n "LocalDensity provides" <screen files>` | use `sp` values from `MaterialTheme.typography`; never override `LocalDensity` font scale |
| Views | `grep -n 'textSize="[0-9]*dp"'` in layouts | `sp` |
| React Native | `allowFontScaling={false}` | remove; `maxFontSizeMultiplier` only with a recorded reason |
| Flutter | `TextScaler.noScaling` | remove |

2. Fixed heights clip scaled text: replace `Modifier.height(x.dp)` on text containers with `heightIn(min = x.dp)`; allow wrapping (no `maxLines = 1` on meaningful text).
3. Preview each state large: `@Preview(fontScale = 2f)` or `@PreviewFontScale` (Compose UI tooling 1.6+). On a device: `adb shell settings put system font_scale 2.0` (Android 14 accepts up to 2.0 with nonlinear scaling; earlier versions top out lower in Settings). Reset: `adb shell settings put system font_scale 1.0`.
4. Also set Display size to largest (Settings > Display > Display size) for one pass, since it changes dp density.

### Output
Fixed layouts and screenshots at `font_scale 2.0`.

### Quality Gate
- Step 1 searches return no matches in the screen's files, or each has a recorded reason.
- Screenshot per state at `font_scale 2.0` shows no clipped or overlapping text.

---

## Phase 2: TalkBack Semantics

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. Apply:

| Element | Compose | Views |
|---|---|---|
| Icon button | `Icon(..., contentDescription = stringResource(R.string.retry))` | `android:contentDescription="@string/retry"` |
| Decorative image | `contentDescription = null` | `android:importantForAccessibility="no"` |
| Row read as one item | `Modifier.semantics(mergeDescendants = true) {}` or `clickable` (merges by default) | focusable parent with `android:screenReaderFocusable="true"` (API 28+) |
| Heading | `Modifier.semantics { heading() }` | `android:accessibilityHeading="true"` / `ViewCompat.setAccessibilityHeading` |
| Custom control state | `Modifier.semantics { stateDescription = "Expanded" }` | `ViewCompat.setStateDescription` |
| Status that changes (error, refresh failed) | `Modifier.semantics { liveRegion = LiveRegionMode.Polite }` | `android:accessibilityLiveRegion="polite"` |

   React Native: `accessibilityLabel`, `accessibilityRole`, `accessibilityLiveRegion="polite"` (Android only). Flutter: `Semantics(label:, header:, liveRegion: true)`.
2. Touch targets at least 48 x 48 dp (Material Design and Android accessibility guidance). Material3 components enforce it via `minimumInteractiveComponentSize()`; add that modifier to custom clickable elements.
3. Announcements from `screen_state_machine.announcements`: prefer a live region on the message; `View.announceForAccessibility` is deprecated as of API level 36, so check the current docs before using it.
4. Contrast 4.5:1 normal text, 3:1 large text (WCAG 2.2 criterion 1.4.3).
5. Do NOT put "button" in descriptions; TalkBack reads the role.

### Output
Semantics added.

### Quality Gate
- `./gradlew :app:lintDebug` shows no `ContentDescription` or `ClickableViewAccessibility` issues for the screen's files (`grep -E "ContentDescription|ClickableViewAccessibility" app/build/reports/lint-results-debug.txt`).
- Every interactive element is listed with its spoken label.

---

## Phase 3: Automated Checks and TalkBack Pass

### Entry Criteria
- Phase 2 builds.

### Actions
1. Espresso (Views): add `androidx.test.espresso:espresso-accessibility` and call `AccessibilityChecks.enable().setRunChecksFromRootView(true)` in `@BeforeClass`; each Espresso action then runs the Accessibility Test Framework checks.
2. Compose: newer `ui-test` versions provide `composeTestRule.enableAccessibilityChecks()` (check the release notes of your `androidx.compose.ui:ui-test-junit4` version); otherwise use step 1 with the Compose host Activity.
3. Write one UI test per state that renders it (via the `testTag` ids) and performs a click to trigger checks. Run `./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=<pkg>.OrdersA11yTest`.
4. Accessibility Scanner app (Google Play) on a device: scan each state; record suggestions.
5. TalkBack pass: enable in Settings > Accessibility > TalkBack (or set the volume-key shortcut). Swipe right through each state and write the spoken order; confirm live-region text is spoken on error.

### Output
`android_a11y_report`.

### Quality Gate
- Instrumented test run `BUILD SUCCESSFUL` with accessibility checks enabled, or each failing check is listed with the view and fix.
- TalkBack reading order is written for every state.

---

## Worked Example

Illustrative only. Orders screen in Compose, `minSdk 26`, emulator API 34.

Phase 1: price `fontSize = 14.dp.toSp()`-style override removed; card `height(72.dp)` changed to `heightIn(min = 72.dp)`.

Phase 3:
```
$ ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.shop.orders.OrdersA11yTest
com.google.android.apps.common.testing.accessibility.framework.integrations.espresso.AccessibilityViewCheckException:
 There was 1 accessibility result: ... TouchTargetSizeCheck: View falls below the minimum recommended size for touch targets.
```
Added `minimumInteractiveComponentSize()` to the sort chip; rerun `BUILD SUCCESSFUL`. TalkBack on error: "Could not load orders. Retry is available. Retry, button."

---

## Exit Criteria

DONE when all states render at font scale 2.0 without clipping, every control has a spoken label and role, status changes use live regions, automated checks and lint pass, and a TalkBack reading order is recorded per state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `font_scale 2.0` ignored on older emulator | **Adjust**: use the largest value Settings offers on that API level and record it. |
| Phase 3 | ATF check fails on a third-party view | **Return**: record it with the library name; suppress only that check for that view with a written reason. |
| Phase 3 | TalkBack reads merged row twice | **Adjust**: remove the inner `contentDescription` or use `clearAndSetSemantics` on the row. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
