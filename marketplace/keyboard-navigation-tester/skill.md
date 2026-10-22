# Keyboard Navigation Tester

Test keyboard navigation: tab order, focus visibility, and interactive element access.

## Inputs

- `automated-findings`: Results from the automated scan
- `site-url`: The site URL

## Outputs

- `keyboard-findings`: Keyboard navigation issues (focus traps, missing focus indicators, illogical tab order)
- `interactive-element-status`: Which interactive elements are and are not keyboard accessible

## Process

1. Tab through each page and verify all interactive elements are reachable.
2. Check that focus indicators are visible on every focused element.
3. Test for keyboard traps (places where tab gets stuck).
4. Verify that custom components (dropdowns, modals, accordions) work with keyboard alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
