# iOS Dynamic Type and VoiceOver

**One-line description:** Makes one screen work at every Dynamic Type size including the five accessibility sizes (text styles, `@ScaledMetric`, layout that switches axis at accessibility sizes) and with VoiceOver (labels, traits, grouping, focus and announcements per state), then proves it with `performAccessibilityAudit()`, Accessibility Inspector and a scripted VoiceOver pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`; supplies states, UI ids and `announcements`.

---

## Outputs

- `ios_a11y_report` (object): Per state: largest-size screenshot path, VoiceOver reading order, audit issues found and fixed, remaining issues with reason.

---

## Phase 1: Dynamic Type

### Entry Criteria
- `app_profile.stack` is `ios`, `react-native` or `flutter`.

### Actions
1. Find fixed font sizes on the screen:

| Stack | Search | Replace with |
|---|---|---|
| SwiftUI | `grep -n "\.font(.system(size:" ` | `.font(.body)` / `.headline` etc., or `.font(.custom(name, size: s, relativeTo: .body))` |
| UIKit | `grep -n "UIFont(name:\|systemFont(ofSize:" ` | `UIFont.preferredFont(forTextStyle:)` or `UIFontMetrics(forTextStyle:).scaledFont(for:)`, and `adjustsFontForContentSizeCategory = true` |
| React Native | `grep -n "allowFontScaling={false}"` | remove it; cap only with `maxFontSizeMultiplier` when a design reason is recorded |
| Flutter | `grep -n "textScaler: TextScaler.noScaling\|textScaleFactor: 1"` | remove the override |

2. Spacing and icon sizes that should grow: `@ScaledMetric(relativeTo: .body) var icon: CGFloat = 24` (the 24 is the design's base size, not a threshold).
3. Layout at accessibility sizes: `@Environment(\.dynamicTypeSize) var size`; when `size.isAccessibilitySize`, render `VStack` instead of `HStack` (or use `ViewThatFits`). Remove `.lineLimit(1)` from labels that carry meaning; allow wrapping.
4. Render each state at `.accessibility5` (largest): in Xcode preview `#Preview { OrdersView().environment(\.dynamicTypeSize, .accessibility5) }`, or on the Simulator `xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`. Reset with `xcrun simctl ui booted content_size large`.

### Output
Updated screen and largest-size screenshots per state.

### Quality Gate
- The grep in step 1 returns no matches for the screen's files (or each remaining match has a recorded reason).
- Screenshots at the largest size exist for every state; no text is clipped or truncated with "..." in them.

---

## Phase 2: VoiceOver Semantics

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. For each element:

| Element | SwiftUI | React Native | Flutter |
|---|---|---|---|
| Icon-only button | `.accessibilityLabel("Retry")` | `accessibilityLabel="Retry"` + `accessibilityRole="button"` | `Semantics(label: 'Retry', button: true)` or `IconButton(tooltip: 'Retry')` |
| Decorative image | `Image(decorative:)` or `.accessibilityHidden(true)` | `accessible={false}` / `importantForAccessibility="no"` | `ExcludeSemantics` |
| Section title | `.accessibilityAddTraits(.isHeader)` | `accessibilityRole="header"` | `Semantics(header: true)` |
| Row with several texts | `.accessibilityElement(children: .combine)` | `accessible={true}` on the row | `MergeSemantics` |
| Value control | `.accessibilityValue("3 items")` | `accessibilityValue={{ text: '3 items' }}` | `Semantics(value: '3 items')` |

2. Announce state changes from `screen_state_machine.announcements`: iOS 17+ `AccessibilityNotification.Announcement(text).post()`, earlier `UIAccessibility.post(notification: .announcement, argument: text)`. React Native `AccessibilityInfo.announceForAccessibility(text)`; Flutter `SemanticsService.announce(text, TextDirection.ltr)`.
3. On entering `Error`, move VoiceOver focus to the error message: SwiftUI `@AccessibilityFocusState` set true; UIKit `UIAccessibility.post(notification: .screenChanged, argument: errorLabel)`.
4. Touch targets at least 44 x 44 pt (Apple Human Interface Guidelines): `.frame(minWidth: 44, minHeight: 44)` or `.contentShape(Rectangle())` with padding.
5. Text contrast at least 4.5:1 for normal text, 3:1 for large text (WCAG 2.2 success criterion 1.4.3). Check both light and dark appearance.
6. Do NOT put the role in the label ("Retry button"); VoiceOver adds "button" from the trait.

### Output
Semantics added.

### Quality Gate
- Every interactive element on the screen has a non-empty label (list them with their labels in the report).
- Each state in `screen_state_machine` has its announcement wired (one call site per announcement).

---

## Phase 3: Audit and VoiceOver Pass

### Entry Criteria
- Phase 2 complete; Xcode 15 or later for the automated audit.

### Actions
1. Add a UI test per state (needs iOS 17 Simulator):
```swift
func testOrdersErrorAccessibility() throws {
    let app = XCUIApplication(); app.launchArguments += ["-UITestState", "error"]; app.launch()
    try app.performAccessibilityAudit()
}
```
   To exclude a known false positive, pass a closure that returns `true` for that issue and record why.
2. Run `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>,OS=<17 or later>' -only-testing:<UITestTarget>/OrdersAccessibilityTests`.
3. Xcode > Open Developer Tool > Accessibility Inspector, target the Simulator, Run Audit on each state; record findings.
4. VoiceOver pass on a device (Settings > Accessibility > VoiceOver, or triple-click the side button if the shortcut is set): swipe right through each state and write down the spoken order; it must follow the visual order and include each announcement.

### Output
`ios_a11y_report`.

### Quality Gate
- The audit tests print `** TEST SUCCEEDED **`, or each failure is listed with the element and fix.
- A written VoiceOver reading order exists for each state.

---

## Worked Example

Illustrative only. Orders screen, target iOS 16, tests on an iOS 17.5 Simulator.

Phase 1: `.font(.system(size: 15))` on the price replaced with `.font(.subheadline)`; row switches to `VStack` at accessibility sizes.

Phase 2: retry icon got `.accessibilityLabel("Retry")`; error announcement "Could not load orders. Retry is available."

Phase 3:
```
$ xcodebuild test ... -only-testing:ShopUITests/OrdersAccessibilityTests
Test Case '-[ShopUITests.OrdersAccessibilityTests testOrdersErrorAccessibility]' failed: Dynamic Type font sizes are unsupported: "$12.40"
```
Fixed the price label font; rerun prints `** TEST SUCCEEDED **`.

---

## Exit Criteria

DONE when every state renders without truncation at the largest Dynamic Type size, every control has a label and correct traits, state changes are announced, the audit passes, and a VoiceOver reading order is recorded per state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Design forbids wrapping | **Return**: record the conflict for the designer; do not cap text size silently. |
| Phase 3 | `performAccessibilityAudit` unavailable | **Adjust**: Simulator runtime below iOS 17 or Xcode below 15; use Accessibility Inspector and record it. |
| Phase 3 | Audit reports contrast issue on a brand color | **Return**: report measured contrast to the designer; do not exclude the issue without approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
