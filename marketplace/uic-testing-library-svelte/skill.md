# Svelte Testing Library Component Tests

**One-line description:** Writes behavior tests for one Svelte 5 component with `@testing-library/svelte`, `@testing-library/user-event` and `@testing-library/jest-dom` on Vitest: the `svelteTesting()` Vite plugin for browser resolution and cleanup, callback-prop spies with `vi.fn()`, `bind:` round-trip through a test harness component, snippet props, keyboard-map tests, and a mutation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): `.svelte` component under test.
- `component_contract` (object, required): Behaviors, props, callback props, snippets.
- `keyboard_map` (object, required): Keys to test.

---

## Outputs

- `svelte_test_files` (object): Test file path, test names mapped to behaviors and keyboard rows, runner summary, and the mutation-check result.

---

## Phase 1: Set Up Vitest for Svelte 5

### Entry Criteria
- `svelte-check` reports 0 errors for the component.

### Actions
1. `npm ls vitest @sveltejs/vite-plugin-svelte @testing-library/svelte @testing-library/user-event @testing-library/jest-dom jsdom --depth=0`.
2. Vitest config:
   ```ts
   import { svelte } from '@sveltejs/vite-plugin-svelte';   // or sveltekit() from '@sveltejs/kit/vite' in a Kit app
   import { svelteTesting } from '@testing-library/svelte/vite';
   export default defineConfig({
     plugins: [svelte(), svelteTesting()],
     test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
   });
   ```
   `svelteTesting()` adds browser resolve conditions (without them Vitest can resolve Svelte's server build and rendering fails with an error saying `mount` is unavailable on the server) and auto-cleanup. Confirm the import path in the installed package's README.
3. Setup file: `import '@testing-library/jest-dom/vitest';`.
4. Run `npx vitest run` once.

### Output
Working config.

### Quality Gate
- Config contains `svelteTesting()`.
- Runner starts without resolve or config errors.

---

## Phase 2: Write the Tests

### Entry Criteria
- Runner works.

### Actions
1. Create `<Name>.test.ts` beside the component (or `src/lib/.../__tests__` per repo convention). Files that use runes outside components must be `.svelte.test.ts`.
2. Render with props: `render(MenuButton, { props: { items, label: 'Actions', onselect } })`. Callback props are plain functions: `const onselect = vi.fn();` then `expect(onselect).toHaveBeenCalledWith('rename')`.
3. `bind:` round-trip: if the repo already keeps test-only `.svelte` files, create a harness component in the test folder (for example `ComboboxHarness.svelte`); otherwise test the controlled path with `value` + `onvaluechange` props and the uncontrolled path with no `value`.
   Harness content: `<script lang="ts">import Combobox from '../Combobox.svelte'; let value = $state(null);</script><Combobox bind:value options={...} label="Country" /><output data-testid="value">{value}</output>`.
4. Snippet props: snippets cannot be written inline in a `.ts` test; use `createRawSnippet` from `svelte` (Svelte 5) or a harness component that passes the snippet. Check the Svelte docs for `createRawSnippet` signature in your version.
5. Queries role-first via `screen`; user actions via `const user = userEvent.setup()` and `await user.keyboard(...)`.
6. Updating props after render: `const { rerender } = render(...); await rerender({ value: 'de' });` (check whether your `@testing-library/svelte` version's `rerender` takes props directly; the API changed between majors).
7. One test per behavior and per keyboard row; controlled and uncontrolled names from `state_ownership_spec`.

### Output
Test file and optional harness.

### Quality Gate
- Every behavior, callback prop and keyboard row has a named test.
- `grep -nE "component\.\\$set|\\$on\(" <test file>` prints nothing (Svelte 4 component API is gone in Svelte 5).
- `grep -c "getByTestId" <test file>` equals recorded exceptions (the harness `output` counts as one).

---

## Phase 3: Run and Mutation-Check

### Entry Criteria
- Tests written.

### Actions
1. `npx vitest run <component_dir>`. Read failures; fix query or semantics.
2. Svelte runtime warnings in output (for example `ownership_invalid_mutation`, `binding_property_non_reactive`) are failures to fix in the component.
3. Mutation check: remove one behavior per group (delete `onselect?.(...)`, a key case); the matching test must fail; restore with `git checkout -- <component_path>`.
4. Record results.

### Output
`svelte_test_files`.

### Quality Gate
- 0 failed; no Svelte runtime warnings in output.
- Each mutation caused a failure; `git diff <component_path>` empty after restore.

---

## Worked Example

Illustrative. `RowActions.test.ts`:
```ts
it('calls onselect and returns focus to the button on Enter', async () => {
  const user = userEvent.setup();
  const onselect = vi.fn();
  render(RowActions, { props: { label: 'Actions', items, onselect } });
  const button = screen.getByRole('button', { name: 'Actions' });
  await user.click(button);
  await user.keyboard('{ArrowDown}{Enter}');
  expect(onselect).toHaveBeenCalledWith('rename');
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute('aria-expanded', 'false');
});
```
- Phase 3: `npx vitest run src/lib/components` prints `Tests 11 passed (11)`; deleting the Escape case fails "closes on Escape and focuses the button"; restored.

---

## Exit Criteria

DONE when behaviors, callback props, binding and keyboard rows are tested role-first, the run is green with no Svelte warnings, and mutations are caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error says `mount` is not available on the server | **Adjust**: add `svelteTesting()` or set `resolve.conditions` to include `browser` for tests. |
| Phase 2 | Cannot pass a snippet from TypeScript | **Adjust**: use a harness component or `createRawSnippet`. |
| Phase 3 | Test passes with behavior removed | **Adjust**: strengthen the assertion to the attribute or focus the behavior changes. |
| Phase 3 | Failing test tempts deletion | **Stop**: fix component or test intent against the contract; never delete or skip it. |

---

## Do Not

- Do not use Svelte 4 test APIs (`component.$set`, `$on`).
- Do not test `$state` variables directly; test the DOM.
- Do not skip `await` on user-event calls.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
