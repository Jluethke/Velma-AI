# React Accessibility Fix and Component Test

**One-line description:** Applies each fix plan task in a React codebase one task at a time: writes a failing jest-axe or vitest-axe plus Testing Library test first, makes the smallest JSX change using native elements, `useRef` focus management and live regions, enables eslint-plugin-jsx-a11y, and commits only when the test, the lint and the full suite pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_plan` (object[], required): Output of `a11y-fix-plan-by-criterion`.
- `repo_dir` (string, required): React repository path.

---

## Outputs

- `react_fix_log` (object[]): One row per task: `task_id`, `status` (fixed, blocked, needs-owner), `files_changed`, `test_file`, `test_failed_before` (bool, with the failing output line), `test_passes_after` (bool), `lint_clean` (bool), `suite_passed` (bool), `commit` (hash), `notes`.

---

## Phase 1: Prepare Test and Lint Tooling

### Entry Criteria
- `repo_dir` has `package.json` with `react` in dependencies.
- The existing test suite passes before any change: run the project's test script (`npm test -- --watchAll=false` for Jest, `npx vitest run` for Vitest). Record the result.

### Actions
1. Detect the runner: `jq '.devDependencies + .dependencies | keys[]' package.json | rg "jest|vitest"`.
2. Install the matching axe matcher and Testing Library if missing:
   - Jest: `npm install --save-dev jest-axe @testing-library/react @testing-library/user-event` (for TypeScript also `@types/jest-axe`).
   - Vitest: `npm install --save-dev vitest-axe @testing-library/react @testing-library/user-event`, and in the setup file: `import * as matchers from 'vitest-axe/matchers'; expect.extend(matchers);`.
3. Lint: `npm install --save-dev eslint-plugin-jsx-a11y`. In a flat config (`eslint.config.js`): `import jsxA11y from 'eslint-plugin-jsx-a11y';` and add `jsxA11y.flatConfigs.recommended` to the exported array. In a legacy `.eslintrc`: add `"plugin:jsx-a11y/recommended"` to `extends`. Check the plugin README for your installed version if the import name differs.
4. Run `npx eslint src --ext .js,.jsx,.ts,.tsx` (flat config ignores `--ext`; use `npx eslint src`). Save the count of `jsx-a11y/*` errors as the baseline; do not fix them all now.

### Output
Test and lint tools ready, baseline recorded.

### Quality Gate
- The test suite baseline result is recorded (pass, or the list of tests already failing before this flow).
- `npx eslint src` runs and reports `jsx-a11y` rules (at least the rule names appear in `npx eslint --print-config src/App.tsx | rg jsx-a11y`).

---

## Phase 2: Red: Write the Failing Test for One Task

### Entry Criteria
- Phase 1 complete. Work on the first task in `fix_plan` whose status is not yet set.

### Actions
1. Create or open the test next to the component, for example `src/components/SizePicker.test.tsx`.
2. Write two kinds of assertions:
   ```tsx
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { axe } from 'jest-axe';            // or: import { axe } from 'vitest-axe'
   import 'jest-axe/extend-expect';            // Jest only, if not in setup
   import SizePicker from './SizePicker';

   test('has no axe violations', async () => {
     const { container } = render(<SizePicker sizes={['S', 'M', 'L']} />);
     expect(await axe(container)).toHaveNoViolations();
   });

   test('sizes are radios operable by keyboard', async () => {
     render(<SizePicker sizes={['S', 'M', 'L']} />);
     const s = screen.getByRole('radio', { name: 'S' });
     s.focus();
     await userEvent.keyboard('{ArrowRight}');
     expect(screen.getByRole('radio', { name: 'M' })).toBeChecked();
   });
   ```
3. jsdom does not compute layout or colors, so `color-contrast` cannot be tested in jsdom; contrast and target size tasks are verified by the Playwright scan instead. Do not write a jsdom test that claims to check contrast.
4. Run only this file: `npx jest src/components/SizePicker.test.tsx` or `npx vitest run src/components/SizePicker.test.tsx`. It must fail for the reason in the task. Copy the failing line into `test_failed_before`.

### Output
A failing test that proves the bug.

### Quality Gate
- The new test fails before the change, and the failure message names the expected role, name, state or axe rule.

---

## Phase 3: Green: Make the Smallest Change

### Entry Criteria
- A failing test exists for the current task.

### Actions
1. Edit only the files listed in the task. One task at a time.
2. Apply the React pattern that matches the task:

   | Problem | React fix |
   |---|---|
   | clickable `div` or `span` | replace with `<button type="button">` (or `<a href>` for navigation) |
   | input label | `<label htmlFor={id}>` with `const id = useId();` (React 18 and later) on the input |
   | error text | `aria-invalid={!!error}` and `aria-describedby={error ? errId : undefined}` on the input; error element `id={errId}` |
   | status or error announcement | keep an always-rendered `<div role="status">{message}</div>` (or `role="alert"` for errors) and change only its text; do not mount the region together with its message |
   | modal focus | prefer native `<dialog>` with `ref.current.showModal()`; it moves focus in and makes the rest inert; on close, call `triggerRef.current?.focus()` |
   | route change focus | in the page component: `const h1 = useRef<HTMLHeadingElement>(null); useEffect(() => { h1.current?.focus(); }, []);` with `<h1 tabIndex={-1} ref={h1}>` |
   | icon button | `<button aria-label="Remove item"><TrashIcon aria-hidden="true" focusable="false" /></button>` |
   | `outline: none` | delete the rule or add a `:focus-visible` rule meeting 3:1 |

3. Do not use `aria-*` props the element does not support; jsx-a11y `aria-props` and `role-supports-aria-props` flag these.
4. Run the single test file again until it passes. Then run `npx eslint <changed files>`; the change must not add new `jsx-a11y` errors.
5. Run the full suite. If a snapshot test fails because the markup changed intentionally, review the snapshot diff, confirm it shows only the intended markup change, and update with `npx jest -u <that test file>` (or `npx vitest run -u <file>`). Never run `-u` on the whole suite.
6. Commit with a message naming the task, SC, and technique: `git commit -m "a11y(FX001): SizePicker uses native radios (WCAG 2.1.1, APG Radio Group)"`.

### Output
`react_fix_log` row for the task. Repeat Phases 2 and 3 for each task.

### Quality Gate
- `test_failed_before` and `test_passes_after` are both true for every row with status fixed.
- The full suite passes, or fails only on the tests that were failing at baseline.
- `npx eslint <changed files>` shows no new `jsx-a11y` errors compared with the baseline.

---

## Worked Example

Illustrative only. Task FX001 (SizePicker, 2.1.1).

```
$ npx vitest run src/components/SizePicker.test.tsx
 FAIL  sizes are radios operable by keyboard
   TestingLibraryElementError: Unable to find an accessible element with the role "radio" and name "S"
```
Change: divs replaced by `<fieldset><legend>Size</legend>` and `<input type="radio" name="size" id=... />` with `<label htmlFor>`; chip styles moved to the label.
```
$ npx vitest run src/components/SizePicker.test.tsx
 ✓ has no axe violations
 ✓ sizes are radios operable by keyboard
$ npx eslint src/components/SizePicker.tsx
$ npx vitest run
 Test Files  48 passed (48)
$ git commit -m "a11y(FX001): SizePicker uses native radios (WCAG 2.1.1, APG Radio Group)"
```
Log row: `status` fixed, `files_changed` ["src/components/SizePicker.tsx", "src/components/SizePicker.module.css"], `suite_passed` true.

---

## Exit Criteria

DONE when every task in `fix_plan` has a `react_fix_log` row with status fixed, blocked, or needs-owner, and every fixed row has a test that failed before and passes after, clean lint on changed files, and a green suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline suite already failing | **Adjust**: record the failing test names; only those may fail later. Do not fix or delete them in this flow. |
| Phase 2 | Test passes before the change | **Stop**: the test does not capture the bug; rewrite it using the `reproduce` step until it fails. |
| Phase 3 | Fix needs a file not listed in the task | **Return**: send the task back to `a11y-fix-plan-by-criterion` to add the file. |
| Phase 3 | Component comes from a UI library (MUI, Chakra, Radix, Headless UI) | **Adjust**: use the library's documented prop (for example its `aria-label` or `slotProps`) after reading its docs; never patch `node_modules`. |

**Do not:** change several tasks in one commit; delete, skip (`test.skip`, `it.only`) or weaken tests; add `// eslint-disable` for `jsx-a11y` rules; hide elements with `aria-hidden` to silence axe; claim fixed without running the test.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
