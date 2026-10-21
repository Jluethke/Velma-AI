# React Testing Library Component Tests

**One-line description:** Writes behavior tests for one React component with `@testing-library/react`, `@testing-library/user-event` v14 and `@testing-library/jest-dom` on Vitest or Jest: role-first queries, `userEvent.setup()` per test, keyboard-map tests, controlled and uncontrolled mode tests, async `findBy` waits, and a mutation check that proves the tests fail when behavior breaks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Component under test.
- `component_contract` (object, required): Behaviors, props, events.
- `keyboard_map` (object, required): Keys to test.

---

## Outputs

- `react_test_files` (object): Test file path, test names mapped to behaviors and keyboard rows, runner output summary, and the mutation-check result.

---

## Phase 1: Set Up the Runner

### Entry Criteria
- Component compiles.

### Actions
1. `npm ls vitest jest @testing-library/react @testing-library/user-event @testing-library/jest-dom @testing-library/dom jsdom --depth=0`.
2. If the repo has neither runner, stop and ask which to add. If it has one, use it.
3. Required pieces (install only the missing ones, after asking): `@testing-library/react`, `@testing-library/dom` (a peer dependency of `@testing-library/react` v16 and later), `@testing-library/user-event`, `@testing-library/jest-dom`, and `jsdom` (or `happy-dom`) for the DOM environment.
4. Vitest config: `test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] }`; setup file contains `import '@testing-library/jest-dom/vitest';`. Vitest does not auto-clean the DOM unless `globals: true`; otherwise add `afterEach(cleanup)` in the setup file. Jest: `testEnvironment: 'jsdom'` and `import '@testing-library/jest-dom'` in the setup file.
5. Run the empty suite once (`npx vitest run` or `npx jest`) to prove the config loads.

### Output
Working runner config.

### Quality Gate
- Runner starts and reports "No test files found" or existing results without config errors.
- `toBeInTheDocument` is typed (setup import present).

---

## Phase 2: Write the Tests

### Entry Criteria
- Runner works.

### Actions
1. Create `<Name>.test.tsx` beside the component (or follow the repo's `__tests__` convention).
2. Query priority (Testing Library guidance): `getByRole` with `{ name }` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` > `getByTestId`. Use `getByTestId` only when no accessible query exists, and record why.
3. Use `screen` for queries. Use `const user = userEvent.setup()` at the start of each test, before `render`, and `await` every `user.*` call.
4. One test per contract behavior, named after it. One test per keyboard map row: `await user.keyboard('{ArrowDown}')`, `'{Escape}'`, `'{Home}'`, `'{Enter}'`, `' '` for Space, `'{Alt>}{ArrowDown}{/Alt}'` for chords; `await user.tab()` for Tab.
5. Assertions by meaning: `expect(input).toHaveAttribute('aria-expanded', 'true')`, `expect(screen.getByRole('option', { name: 'Germany' })).toHaveAttribute('aria-selected', 'true')`, `expect(button).toHaveFocus()`, `expect(onValueChange).toHaveBeenCalledWith('de')`.
6. Controlled and uncontrolled tests: copy the test names from `state_ownership_spec`. Controlled-accept uses a small wrapper component holding `useState`.
7. Async: `await screen.findByRole('option', { name: 'Germany' })` for content that appears later; `waitFor` only for assertions with no element to find. Fake timers with user-event: `vi.useFakeTimers({ shouldAdvanceTime: true })` and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
8. Absence: `expect(screen.queryByRole('listbox')).not.toBeInTheDocument()`.

### Output
Test file.

### Quality Gate
- Every behavior and every non-native keyboard row has a test whose name contains it.
- `grep -c "getByTestId" <test file>` equals the number of recorded exceptions.
- `grep -nE "fireEvent\.|container\.querySelector" <test file>` prints nothing, or each hit has a comment naming why user-event or a role query cannot do it.

---

## Phase 3: Run and Mutation-Check

### Entry Criteria
- Tests written.

### Actions
1. Run `npx vitest run <component_dir>` (or `npx jest <component_dir>`). All pass. Read failures from the "Unable to find an accessible element with the role" message: it prints the accessible roles present; fix the query or the component's ARIA, not the test's intent.
2. Warnings `An update to X inside a test was not wrapped in act(...)` mean an async update finished after the test; await the user action or a `findBy` for the resulting UI.
3. Mutation check: temporarily break one behavior per test group (for example comment out the `Escape` case) and rerun; the matching test must fail. Restore with `git checkout -- <component_path>` and rerun to green.
4. Record the summary line and the mutation results.

### Output
`react_test_files`.

### Quality Gate
- Final run: 0 failed, and no `act(...)` warnings in output.
- Each mutation produced at least one failing test; `git diff <component_path>` is empty after restore.

---

## Worked Example

Illustrative. `src/components/Combobox/Combobox.test.tsx`:
```tsx
it('opens and highlights the first option on ArrowDown', async () => {
  const user = userEvent.setup();
  render(<Combobox label="Country" options={opts} />);
  const input = screen.getByRole('combobox', { name: 'Country' });
  await user.click(input);
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('option', { name: 'Austria' })).toHaveAttribute('aria-selected', 'true');
});
```
- Phase 3: `npx vitest run src/components/Combobox` prints `Tests 14 passed (14)`. Removing the Escape case makes "closes on Escape" fail; restored.

---

## Exit Criteria

DONE when every behavior and keyboard row has a role-first test, the suite passes without `act` warnings, and the mutation check shows the tests catch broken behavior.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `toBeInTheDocument is not a function` | **Adjust**: jest-dom setup import missing from `setupFiles`. |
| Phase 2 | No accessible role for an element | **Adjust**: fix the component's semantics first; a missing role is an accessibility bug. |
| Phase 3 | Test passes with behavior removed | **Adjust**: assertion is too weak; assert the attribute or focus that the behavior changes. |
| Phase 3 | Test fails and you are tempted to change the expected value | **Stop**: decide whether the component or the test is wrong against the contract; never weaken to get green. |

---

## Do Not

- Do not snapshot the whole DOM as the main assertion.
- Do not delete, skip (`it.skip`) or loosen a failing test to get green.
- Do not test implementation details (state variables, hook calls).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
