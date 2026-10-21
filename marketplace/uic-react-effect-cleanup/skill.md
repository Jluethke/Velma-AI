# React Effect Cleanup Audit

**One-line description:** Inventories every `useEffect` and `useLayoutEffect` in one React component, classifies each by the resource it acquires, adds the exact cleanup that releases it (listener removal, timer clear, `AbortController.abort()`, observer `disconnect()`, unsubscribe, stale-response flag), deletes effects that only derive render data, and proves cleanup with StrictMode and an unmount test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): The React component file.
- `repo_dir` (string, required): Repository root.
- `hooks_lint_report` (object, required): From `uic-react-hooks-lint`; must show zero `react-hooks/` findings, so dependency arrays are already correct before cleanups are added.

---

## Outputs

- `effect_cleanup_report` (object): Table of effect (line), resource kind, cleanup added, and the unmount-test name proving it, plus deleted effects with the render-time replacement.

---

## Phase 1: Inventory Effects

### Entry Criteria
- `component_path` exists.
- `hooks_lint_report` shows ESLint exit 0 for the component directory.

### Actions
1. `grep -nE "use(Layout|Insertion)?Effect\(" <component_path>` and also grep any custom hooks it imports from the same folder.
2. For each effect, record what it does using this classification:

   | Body contains | Resource kind | Required cleanup |
   |---|---|---|
   | `addEventListener` on `window`/`document`/element | listener | `removeEventListener` with the same function reference and same `capture` option |
   | `setTimeout` / `setInterval` | timer | `clearTimeout(id)` / `clearInterval(id)` |
   | `requestAnimationFrame` | frame | `cancelAnimationFrame(id)` |
   | `fetch(` or an async client call | request | `const ac = new AbortController()`, pass `signal: ac.signal`, cleanup `ac.abort()`; ignore `AbortError` in the catch |
   | Promise whose result calls `setState` (no abort support) | race | `let ignore = false;` set `ignore = true` in cleanup, check before `setState` |
   | `new ResizeObserver` / `IntersectionObserver` / `MutationObserver` | observer | `observer.disconnect()` |
   | `.subscribe(` on a store or emitter | subscription | the returned unsubscribe; for external stores prefer `useSyncExternalStore` |
   | Third-party widget init (`new Chart(`, `createPopper(`) | instance | the library's documented destroy method (read its docs, do not guess the name) |
   | Only `setState` of a value computed from props or state | derived state | delete the effect; compute during render |
   | Only reacts to a user action already handled in an event handler | event logic | move into the handler; delete the effect |

3. Mark each effect with its row.

### Output
Effect inventory.

### Quality Gate
- Inventory count equals the grep hit count.
- Every effect has exactly one row.

---

## Phase 2: Add Cleanups and Delete Unneeded Effects

### Entry Criteria
- Inventory complete.

### Actions
1. Edit one effect at a time. Return the cleanup function from the effect: `return () => { ... };`.
2. Listeners: define the handler inside the effect so add and remove share the same reference. If the listener used `{ capture: true }`, pass the same to `removeEventListener`.
3. Requests: example
   ```ts
   useEffect(() => {
     const ac = new AbortController();
     fetch(url, { signal: ac.signal })
       .then((r) => r.json())
       .then(setData)
       .catch((e) => { if (e.name !== 'AbortError') setError(e); });
     return () => ac.abort();
   }, [url]);
   ```
4. Derived-state deletions: replace `useEffect(() => setFiltered(filter(items, q)), [items, q])` with `const filtered = filter(items, q);` in render.
5. `useLayoutEffect` is only for DOM measurement before paint; if the effect does not read layout (`getBoundingClientRect`, `offsetWidth`), change it to `useEffect`.
6. Rerun ESLint (`npx eslint <component_path> --max-warnings 0`) after each edit.

### Output
Updated component.

### Quality Gate
- Every inventory row with a required cleanup has a `return () =>` in that effect.
- `grep -c addEventListener` equals `grep -c removeEventListener` in the file.
- ESLint exit 0.

---

## Phase 3: Prove Cleanup Runs

### Entry Criteria
- Edits done.

### Actions
1. Confirm the app or test wrapper renders under `<React.StrictMode>` in development; StrictMode runs mount, cleanup, mount once for every effect, so a missing cleanup shows as doubled listeners or requests in development.
2. Write one unmount test per resource kind using the repo's runner (Vitest shown):
   ```ts
   it('removes the document listener on unmount', () => {
     const remove = vi.spyOn(document, 'removeEventListener');
     const { unmount } = render(<Combobox options={opts} label="Country" />);
     unmount();
     expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
   });
   ```
   For timers: `vi.useFakeTimers()`, render, unmount, `vi.runAllTimers()`, assert the callback spy was not called. For requests: assert the `signal.aborted` of the captured fetch call is `true` after unmount.
3. Run `npx vitest run <component_dir>`. Record the summary.
4. React 18 and later no longer print "Can't perform a React state update on an unmounted component", so the absence of that warning proves nothing; rely on the tests.

### Output
`effect_cleanup_report`.

### Quality Gate
- One passing unmount test per resource kind found in Phase 1.
- Test summary shows 0 failed.

---

## Worked Example

Illustrative. `src/components/Combobox/Combobox.tsx` has 3 effects.

- Phase 1: line 52 `document.addEventListener('pointerdown', onOutside)` (listener, no cleanup); line 70 `setFiltered(...)` (derived state); line 81 debounced `setTimeout` search (timer, no clear).
- Phase 2: listener effect returns `() => document.removeEventListener('pointerdown', onOutside)`; line 70 effect deleted, `const filtered = options.filter(...)`; timer effect returns `() => clearTimeout(id)`.
- Phase 3: `npx vitest run src/components/Combobox` prints `Tests 2 passed (2)`.

---

## Exit Criteria

DONE when every effect is classified, every resource-acquiring effect returns its cleanup, derived-state effects are gone, and one unmount test per resource kind passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Effect lives in a hook from another package | **Adjust**: record it as external; do not edit `node_modules`. |
| Phase 2 | Third-party destroy method unknown | **Stop**: read the library's docs or type definitions (`node_modules/<pkg>/dist/*.d.ts`); never invent a method name. |
| Phase 3 | Spy assertion fails because options object differs | **Adjust**: match the exact third argument used in `addEventListener`. |
| Phase 3 | Test fails for unrelated reasons | **Return**: report the failing test; do not delete it. |

---

## Do Not

- Do not add an empty dependency array to "make it run once" when the effect reads props.
- Do not remove StrictMode to hide doubled effects.
- Do not use `isMounted` flags as a substitute for aborting requests that support `AbortSignal`.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
