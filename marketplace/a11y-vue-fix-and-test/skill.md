# Vue Accessibility Fix and Component Test

**One-line description:** Applies each fix plan task in a Vue 3 codebase one task at a time: writes a failing vitest-axe plus `@testing-library/vue` test first, makes the smallest single-file-component change (native elements, `useId`, `nextTick` focus, persistent live regions, Vue Router title and focus hooks), enables eslint-plugin-vuejs-accessibility, and commits only when test, lint and suite pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_plan` (object[], required): Output of `a11y-fix-plan-by-criterion`.
- `repo_dir` (string, required): Vue repository path.

---

## Outputs

- `vue_fix_log` (object[]): One row per task: `task_id`, `status` (fixed, blocked, needs-owner), `files_changed`, `test_file`, `test_failed_before`, `test_passes_after`, `lint_clean`, `suite_passed`, `commit`, `notes`.

---

## Phase 1: Prepare Test and Lint Tooling

### Entry Criteria
- `package.json` lists `vue` at major version 3: `jq -r '.dependencies.vue' package.json`.
- Baseline suite run recorded: `npx vitest run`.

### Actions
1. Install if missing: `npm install --save-dev vitest-axe @testing-library/vue @testing-library/user-event jsdom`.
2. In the Vitest setup file (named in `vitest.config.ts` under `test.setupFiles`):
   ```ts
   import * as matchers from 'vitest-axe/matchers';
   import { expect } from 'vitest';
   expect.extend(matchers);
   ```
   and set `test.environment: 'jsdom'` in `vitest.config.ts`.
3. Lint: `npm install --save-dev eslint-plugin-vuejs-accessibility`. Flat config: `import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';` then spread `...pluginVueA11y.configs['flat/recommended']` into the exported array. Legacy config: add `"plugin:vuejs-accessibility/recommended"` to `extends`. Confirm the config name in the plugin README for your installed version.
4. Record the baseline: `npx eslint src` and count `vuejs-accessibility/*` errors.

### Output
Tools ready, baselines recorded.

### Quality Gate
- `npx vitest run` baseline result recorded.
- `npx eslint --print-config src/App.vue | rg vuejs-accessibility` prints rule names.

---

## Phase 2: Red: Failing Test for One Task

### Entry Criteria
- Phase 1 complete; take the first task without a status.

### Actions
1. Write a test next to the component, for example `src/components/ShippingForm.spec.ts`:
   ```ts
   import { render, screen } from '@testing-library/vue';
   import userEvent from '@testing-library/user-event';
   import { axe } from 'vitest-axe';
   import { test, expect } from 'vitest';
   import ShippingForm from './ShippingForm.vue';

   test('no axe violations in error state', async () => {
     const { container } = render(ShippingForm);
     await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
     expect(await axe(container)).toHaveNoViolations();
   });

   test('postal code error is tied to the field', async () => {
     render(ShippingForm);
     await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
     const zip = screen.getByRole('textbox', { name: 'ZIP code' });
     expect(zip).toHaveAttribute('aria-invalid', 'true');
     expect(zip).toHaveAccessibleDescription(/enter a 5-digit zip/i);
   });
   ```
   `toHaveAttribute` and `toHaveAccessibleDescription` come from `@testing-library/jest-dom`; install it and add `import '@testing-library/jest-dom/vitest'` to the setup file if not present.
2. jsdom cannot test color contrast or target size; verify those with the Playwright scan.
3. Run `npx vitest run src/components/ShippingForm.spec.ts`; it must fail for the task's reason. Save the failing line.

### Output
A failing test.

### Quality Gate
- The test fails before the change with a message about the expected role, name, description, state or axe rule.

---

## Phase 3: Green: Smallest SFC Change

### Entry Criteria
- A failing test for the current task.

### Actions
1. Edit only the task's files.
2. Apply the Vue pattern:

   | Problem | Vue fix |
   |---|---|
   | label | `<label :for="id">` and `<input :id="id">` with `const id = useId()` (Vue 3.5 and later; on older versions pass an id prop) |
   | error tied to field | `:aria-invalid="!!errors.zip"` and `:aria-describedby="errors.zip ? id + '-err' : undefined"`; error `<p :id="id + '-err'">` |
   | live region | keep `<div role="status">{{ statusText }}</div>` always rendered (not inside `v-if`); change `statusText` only |
   | focus after `v-if` shows content | `await nextTick(); el.value?.focus()` with a template ref, because the element does not exist until the DOM updates |
   | route change | in `router.afterEach((to) => { document.title = to.meta.title ?? 'Site'; nextTick(() => document.querySelector('h1')?.focus()); })` with `<h1 tabindex="-1">` |
   | clickable element | `<button type="button" @click="...">` instead of `<div @click>` |
   | attribute fallthrough | when a wrapper component renders `<label><input></label>`, set `inheritAttrs: false` and `v-bind="$attrs"` on the `input` so `aria-*` attributes reach the control |
   | modal | native `<dialog ref="dlg">` with `dlg.value.showModal()`; on close focus the trigger ref |

3. Run the test file until it passes, then `npx eslint <changed files>` (no new `vuejs-accessibility` errors), then `npx vitest run` for the full suite. Update snapshots only for the changed component file: `npx vitest run -u <file>` after reviewing the diff.
4. Commit: `git commit -m "a11y(FX003): ShippingForm errors tied to fields (WCAG 3.3.1, ARIA21)"`.

### Output
`vue_fix_log` row. Repeat Phases 2 and 3 per task.

### Quality Gate
- Every fixed row has `test_failed_before` and `test_passes_after` true.
- Full suite passes or fails only on baseline failures.
- No new `vuejs-accessibility` lint errors on changed files.

---

## Worked Example

Illustrative only. Task FX003 (ZIP error not tied to field, 3.3.1 and 4.1.2).

```
$ npx vitest run src/components/ShippingForm.spec.ts
 FAIL  postal code error is tied to the field
   Expected the element to have attribute: aria-invalid="true"
   Received: null
```
Change in `ShippingForm.vue`: add `:aria-invalid` and `:aria-describedby` to the ZIP input and an `id` on the error paragraph.
```
$ npx vitest run src/components/ShippingForm.spec.ts
 ✓ no axe violations in error state
 ✓ postal code error is tied to the field
$ npx eslint src/components/ShippingForm.vue
$ npx vitest run
 Test Files  31 passed (31)
```

---

## Exit Criteria

DONE when every `fix_plan` task has a `vue_fix_log` row, and every fixed row has a red-then-green test, clean lint on changed files, a green suite, and its own commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project is Vue 2 | **Adjust**: use `@testing-library/vue` version 5 and jest-axe per their docs; `useId` is not available, pass ids as props. |
| Phase 2 | Component needs Pinia or Router to render | **Adjust**: pass `global: { plugins: [createTestingPinia(), router] }` in the `render` options as documented by the libraries. |
| Phase 3 | Nuxt auto-imports break the test | **Adjust**: use `@nuxt/test-utils` with its Vitest environment as documented; do not stub the component under test. |

**Do not:** fix several tasks per commit; delete or skip tests; add `<!-- eslint-disable -->` for accessibility rules; put the live region inside `v-if`; claim fixed without the test run.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
