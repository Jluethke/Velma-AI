# Jest Order Dependence Detection

**One-line description:** Detects whether a Jest test depends on the order of tests inside its file or on other files sharing an external resource, using `--randomize` with recorded `--seed` values, then bisects to the polluting test case or file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Supplies the test file, name and CI command.
- `node_flake_rate_report` (object, required): From `flk-node-jest-loop-measure`; its table reading selects in-file or cross-file search.
- `repeat_count` (integer, required): Number of seeds to try.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_order_report` (object): `{scope: "in_file"|"cross_file"|"none", failing_seeds[], polluter, two_item_repro_command, mechanism_hint}`.

---

## Phase 1: Know Jest's Isolation Model

### Entry Criteria
- `node_flake_rate_report` exists.

### Actions
1. Read these facts before searching; they decide where pollution can come from:
   - Each test file runs in its own module registry and its own test environment (`node` or `jsdom`). Module-level variables and `jest.mock` calls do not leak between files.
   - Within one file, tests share the module registry, module-level variables, the jsdom `document`, and mocks unless config clears them.
   - Across files, only things outside the process sandbox leak: databases, files on disk, ports, Redis, environment set in `globalSetup`, and native globals patched in `setupFiles` only if the patch mutates a shared external thing.
2. Choose scope from `node_flake_rate_report`: whole-file failures with single-test passes means `in_file`; CI-selection-only failures means `cross_file`.
3. Check the flags exist in this Jest version: `npx jest --help | grep -E "randomize|seed|showSeed"`. `--randomize` (shuffles test order within each file) and `--seed`, `--showSeed` were added in Jest 29.2. If missing, use the manual method in Phase 2 action 4.

### Output
Chosen scope.

### Quality Gate
- The scope cites which counts in `node_flake_rate_report` selected it.

---

## Phase 2: Find A Failing Order

### Entry Criteria
- Scope chosen.

### Actions
1. In-file scope:
   `for s in $(seq 1 <repeat_count>); do npx jest <file> --ci --runInBand --randomize --seed=$s --json --outputFile=flk-$s.json > /dev/null 2>&1; node -e "const r=require('./flk-$s.json'); if (r.numFailedTests>0) console.log('FAIL', $s)"; done`
2. Replay a failing seed: `npx jest <file> --ci --runInBand --randomize --seed=<seed> --verbose`. `--verbose` prints tests in executed order; copy that order.
3. Cross-file scope: Jest does not shuffle file order with `--randomize`. Get the file list with `npx jest --listTests`, then run the victim file together with each other file in band: `npx jest --runInBand --ci <other-file> <victim-file>`. In band, Jest normally schedules files by previous duration and failure history, not argument order; to force order, add a custom sequencer (`testSequencer` config pointing to a class that extends `@jest/test-sequencer` and returns files in a fixed order). Check the Jest docs page "Configuring Jest: testSequencer" for the exact class API in your version.
4. Without `--randomize` (older Jest): copy the victim file, then reorder `test(...)` blocks by hand in the copy under a temp name and run it; never edit the original for the search.

### Output
`failing_seeds` and an executed order.

### Quality Gate
- One failing seed replays to a failure twice, with its executed order copied from `--verbose`.

---

## Phase 3: Bisect And Confirm

### Entry Criteria
- A failing order exists.

### Actions
1. In-file: take the tests executed before the victim in the failing order. Use `-t` with an alternation regex to run a subset plus the victim with the same seed is not stable (subset changes the shuffle), so instead use `test.only` in a temporary uncommitted copy of the file: keep the victim and one half of the preceding tests, ordered as in the failing run, and run it in band. Keep the half that fails. Repeat until one test remains.
2. Cross-file: halve the candidate file list with the fixed-order sequencer until one file remains.
3. Confirm with a two-item reproduction: polluter then victim fails; victim alone passes. Record the command as `two_item_repro_command`.
4. Set `mechanism_hint` from:

| Seen in polluter | Mechanism |
|---|---|
| `jest.spyOn(...)` or `jest.fn().mockReturnValue` with no restore and `restoreMocks` off | leaked mock |
| Assigns a module-level `let` or mutates an imported object | leaked module state |
| `process.env.X =` without restore | leaked env |
| `document.body.innerHTML` or appended nodes not cleaned | leaked DOM |
| `jest.useFakeTimers()` with no `useRealTimers()` | leaked fake clock |
| Writes rows, files or keys outside the test sandbox | leaked external resource |

5. Do NOT fix by adding `--runInBand` to CI or by moving the victim to another file to dodge the polluter.
6. Delete the temporary copy and `flk-*.json`; `git status --porcelain` must show nothing new.

### Output
`node_order_report`.

### Quality Gate
- Two-item run fails polluter-first and passes victim-alone, both outputs recorded.
- `git -C <repo_path> status --porcelain` is empty.

---

## Worked Example

Illustrative. `src/cart/cart.test.ts`, victim `Cart applies coupon once`, Jest 29.7.0, scope `in_file`.

- Phase 2: seeds 4, 19, 77 fail. `npx jest src/cart/cart.test.ts --ci --runInBand --randomize --seed=19 --verbose` shows `Cart caches totals` ran before the victim.
- Phase 3: temporary copy with `test.only` on those two fails; victim alone passes. Polluter calls `jest.spyOn(pricing, 'discountFor').mockReturnValue(0.1)` and the config has no `restoreMocks`. `mechanism_hint` = leaked mock.

---

## Exit Criteria

DONE when `node_order_report` names a confirmed polluter with a two-item reproduction or sets `scope: "none"` with the seeds tried.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Jest older than 29.2 (no `--randomize`) | **Adjust**: use the manual reordering in Phase 2 action 4. |
| Phase 2 | No failing seed | **Return**: `scope: "none"`; the classifier uses other evidence. |
| Phase 3 | Polluter needs two other tests together | **Adjust**: bisect pairs; record both. |
| Phase 3 | Temp copy left in the tree | **Stop**: delete it before returning. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
