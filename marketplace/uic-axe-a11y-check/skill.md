# Automated Accessibility Check with axe-core

**One-line description:** Runs axe-core against every meaningful state of one component, in jsdom through `jest-axe`/`vitest-axe` for fast structural rules and in a real browser through `@axe-core/playwright` for rules jsdom cannot evaluate (color contrast), tags the run to the WCAG level the product targets, reads each violation's `id`, `impact`, `nodes[].target` and `failureSummary`, fixes the component, and records the manual checks axe cannot do.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Component under test.
- `stack` (string, required): `react`, `vue` or `svelte`; decides the render import.

---

## Outputs

- `a11y_report` (object): States scanned, axe version, tags used, violations found and fixed (rule id, impact, target, fix), incomplete results reviewed, and the manual check list with results.

---

## Phase 1: Choose Runners and States

### Entry Criteria
- Component renders in tests.

### Actions
1. `npm ls axe-core jest-axe vitest-axe @axe-core/playwright @playwright/test --depth=0`.
2. Pick runners:

   | Need | Runner |
   |---|---|
   | Fast check in the unit test suite | `jest-axe` (Jest or Vitest with `expect.extend`) or `vitest-axe` |
   | Color contrast, rendered layout, real focus | `@axe-core/playwright` against the dev server or Storybook |
   | Per-story check in Storybook | `@storybook/addon-a11y` (see `uic-storybook-stories`) |

   jsdom does not compute layout or colors, so the `color-contrast` rule cannot run there; the jest-axe README documents this. A browser run is required for contrast.
3. List states to scan: default, open/expanded, with an active option or selected tab, disabled, invalid/error, empty results, and right-to-left if supported. Each state is one scan.
4. Tags: use the WCAG level the product targets (ask if unknown). For WCAG 2.2 AA: `['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']`. Check axe-core's tag list for your installed version (`node -e "console.log(require('axe-core').version)"`).

### Output
Runner choice, state list, tags.

### Quality Gate
- State list includes every interactive state in the contract.
- Tags are written out, and the WCAG target level has a source (user or product doc).

---

## Phase 2: Scan

### Entry Criteria
- Runners installed (ask before adding dependencies).

### Actions
1. Unit-level (Vitest + jest-axe shown; same shape for React, Vue and Svelte render functions):
   ```ts
   import { axe, toHaveNoViolations } from 'jest-axe';
   expect.extend(toHaveNoViolations);
   it('has no axe violations when open', async () => {
     const user = userEvent.setup();
     const { container } = render(Combobox, /* props */);
     await user.click(screen.getByRole('combobox'));
     await user.keyboard('{ArrowDown}');
     expect(await axe(container)).toHaveNoViolations();
   });
   ```
2. Browser-level:
   ```ts
   import AxeBuilder from '@axe-core/playwright';
   test('combobox open state', async ({ page }) => {
     await page.goto('/iframe.html?id=components-combobox--default&viewMode=story');
     await page.getByRole('combobox').click();
     await page.keyboard.press('ArrowDown');
     const results = await new AxeBuilder({ page }).include('#storybook-root')
       .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
     expect(results.violations).toEqual([]);
   });
   ```
   The Storybook root id differs by version (`#storybook-root` in 7 and later, `#root` earlier); check the iframe DOM.
3. Run both suites. For each violation record: `id` (for example `aria-required-children`), `impact` (`minor`/`moderate`/`serious`/`critical`), `nodes[].target` (CSS selector), `failureSummary`, and `helpUrl`.
4. Also read `results.incomplete`: items axe could not decide (often contrast over images or gradients). Each needs a manual decision.

### Output
Violation and incomplete lists per state.

### Quality Gate
- Every state from Phase 1 has a scan result recorded (pass or violation list).
- Every violation has id, impact, target and failureSummary recorded.

---

## Phase 3: Fix and Record Manual Checks

### Entry Criteria
- Scan results exist.

### Actions
1. Fix violations in the component, one rule at a time, starting with `critical` and `serious`. Rerun after each fix.
2. Never disable a rule globally (`rules: { 'color-contrast': { enabled: false } }`) to pass. The only allowed exclusion is a third-party element outside the component, excluded with `.exclude(selector)` and recorded.
3. Manual checks axe cannot automate (W3C and Deque both state automated tools find a subset of issues): keyboard-only operation of every map row; screen reader announcement of name, role, state (NVDA + Firefox/Chrome, VoiceOver + Safari); 200% zoom and 320 CSS px wide reflow (WCAG 2.2 SC 1.4.10 Reflow); focus visible; forced-colors mode (Windows contrast theme or Chrome DevTools Rendering > "Emulate CSS media feature forced-colors"); `prefers-reduced-motion` emulation.
4. Record pass/fail for each manual check.

### Output
`a11y_report`.

### Quality Gate
- Final rerun: `violations` is empty for every state in both runners.
- No rule disabled; every `.exclude()` has a recorded reason.
- Every manual check has a recorded result.

---

## Worked Example

Illustrative. React combobox.

- Phase 2: jsdom open state reports `aria-valid-attr-value` (critical) on `#cb-input`: `aria-activedescendant` points to `cb-opt-3` which does not exist after filtering. Browser run reports `color-contrast` (serious) on `.option[aria-selected="true"]`: "Element has insufficient color contrast of 3.1 (foreground color: #6b7280, background color: #e5e7eb...)".
- Phase 3: reset `activeIndex` when the filtered list changes; darken the selected text token. Rerun: `violations` `[]` in all 6 states. Manual: VoiceOver reads "Germany, 2 of 5"; 320 px reflow passes.

---

## Exit Criteria

DONE when every state scans clean in jsdom and in a real browser with the target WCAG tags, incomplete results are decided, and manual checks are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | WCAG target unknown | **Stop**: ask; do not pick a level for the product. |
| Phase 2 | jsdom run shows no contrast results | **Adjust**: expected; rely on the browser run for contrast. |
| Phase 2 | Violation inside a third-party child | **Adjust**: `.exclude()` it, record it, report upstream. |
| Phase 3 | Fix for one rule creates another | **Retry**: rerun the full scan after each fix, not just the rule. |

---

## Do Not

- Do not claim "accessible" from a clean axe run alone.
- Do not disable rules to get green.
- Do not scan only the closed default state.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
