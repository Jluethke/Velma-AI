# Vue Testing Library Component Tests

**One-line description:** Writes behavior tests for one Vue 3 component with `@testing-library/vue` (v8 for Vue 3), `@testing-library/user-event` and `@testing-library/jest-dom` on Vitest: role-first queries, `emitted()` assertions for events and `update:modelValue`, `v-model` round-trip through a wrapper, slot rendering, keyboard-map tests, and a mutation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): `.vue` component under test.
- `component_contract` (object, required): Behaviors, props, emits, slots.
- `keyboard_map` (object, required): Keys to test.

---

## Outputs

- `vue_test_files` (object): Test file path, test names mapped to behaviors and keyboard rows, runner summary, and the mutation-check result.

---

## Phase 1: Set Up Vitest for Vue

### Entry Criteria
- `vue-tsc --noEmit` passes for the component.

### Actions
1. `npm ls vitest @vitejs/plugin-vue @testing-library/vue @testing-library/user-event @testing-library/jest-dom jsdom --depth=0`.
2. `@testing-library/vue` v8 or later targets Vue 3; v5 and earlier target Vue 2. If the wrong major is installed, stop and report.
3. `vitest.config.ts` (or the `test` key in `vite.config.ts`) needs `plugins: [vue()]`, `test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] }`. Setup: `import '@testing-library/jest-dom/vitest';` and, unless `globals: true`, `import { cleanup } from '@testing-library/vue'; afterEach(cleanup);`.
4. If the component uses vue-i18n, Pinia or a router, pass them through `render(Comp, { global: { plugins: [i18n, pinia] } })`; build a small `renderWithPlugins` helper in the test file if more than one test needs it.
5. Run `npx vitest run` once to confirm the config loads.

### Output
Working config.

### Quality Gate
- `@testing-library/vue` major is 8 or later in `npm ls`.
- Empty or existing suite runs without config errors.

---

## Phase 2: Write the Tests

### Entry Criteria
- Runner works.

### Actions
1. Create `<Name>.spec.ts` (or `.test.ts`) next to the component following repo convention.
2. Render: `const { emitted } = render(AppTabs, { props: { tabs, active: 'profile' } });`. Slots: `render(Comp, { slots: { default: '<p>Body</p>', option: '<template #option="{ option }">{{ option.label }}</template>' } })` (check the `@testing-library/vue` docs for scoped-slot syntax in your version).
3. Queries: `screen.getByRole('tab', { name: 'Billing' })` first; same priority list as Testing Library core.
4. User actions: `const user = userEvent.setup()`; `await user.click(...)`, `await user.keyboard('{ArrowRight}')`, `await user.tab()`.
5. Events: `expect(emitted()['update:active']).toEqual([['billing']])` (each emission is an array of arguments). For named models, the event is `update:<name>`.
6. `v-model` round-trip (controlled-accept test): define a wrapper in the test with `defineComponent({ components: { AppTabs }, setup() { const active = ref('profile'); return { active }; }, template: '<AppTabs v-model:active="active" :tabs="tabs" />' })`. Runtime templates need the full Vue build: alias `vue` to `vue/dist/vue.esm-bundler.js` in the Vitest config, or write the wrapper with a render function `h(AppTabs, { active: active.value, 'onUpdate:active': (v) => (active.value = v), tabs })` (preferred: no alias needed).
7. Controlled-reject test: render with a fixed prop and no listener update; after a click, assert the selected tab did not change and `emitted()` recorded the attempt.
8. Keyboard rows: one test per row, named after it.
9. DOM updates in Vue are async; `await` the user-event call, which flushes; for programmatic prop changes use `await rerender({ active: 'billing' })`.

### Output
Test file.

### Quality Gate
- Every behavior, emit and keyboard row has a named test.
- `grep -nE "wrapper\.vm|\.setData\(" <test file>` prints nothing (no internals).
- `grep -c "getByTestId" <test file>` equals recorded exceptions.

---

## Phase 3: Run and Mutation-Check

### Entry Criteria
- Tests written.

### Actions
1. `npx vitest run <component_dir>`. Fix query or component semantics on failure.
2. Vue warnings in output (`[Vue warn]: Missing required prop`, `Extraneous non-emits event listeners`) are failures to fix: pass required props, declare emits.
3. Mutation check: break one behavior per group (remove the `emit`, comment out a key case); the matching test must fail; restore with `git checkout -- <component_path>`.
4. Record results.

### Output
`vue_test_files`.

### Quality Gate
- 0 failed and no `[Vue warn]` lines in the run output.
- Each mutation caused a failure; `git diff <component_path>` empty after restore.

---

## Worked Example

Illustrative. `AppTabs.spec.ts`:
```ts
it('selects the next tab on ArrowRight and emits update:active', async () => {
  const user = userEvent.setup();
  const { emitted } = render(AppTabs, { props: { tabs, active: 'profile' } });
  await user.click(screen.getByRole('tab', { name: 'Profile' }));
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Billing' })).toHaveFocus();
  expect(emitted()['update:active']).toEqual([['billing']]);
});
```
- Phase 3: `npx vitest run src/components/AppTabs` prints `Tests 9 passed (9)`; removing `active.value = next` makes two tests fail; restored.

---

## Exit Criteria

DONE when behaviors, emits, `v-model` round-trip and keyboard rows are tested with role-first queries, the run is green with no Vue warnings, and mutations are caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `@testing-library/vue` v5 with Vue 3 | **Stop**: report the version mismatch; ask before upgrading. |
| Phase 2 | "Component provided template option but runtime compilation is not supported" | **Adjust**: use the render-function wrapper. |
| Phase 3 | `emitted()` key missing | **Adjust**: the component did not emit or uses a different event name; check `defineEmits`/`defineModel` name. |
| Phase 3 | Temptation to delete a failing test | **Stop**: compare against the contract; fix the component or the test intent, never remove it. |

---

## Do Not

- Do not use `@vue/test-utils` `wrapper.vm` internals in Testing Library tests.
- Do not assert on CSS class names to infer state; assert ARIA attributes.
- Do not skip `await` on user-event calls.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
