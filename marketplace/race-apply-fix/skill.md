# Apply a Concurrency Fix One Site at a Time

**One-line description:** Applies the chosen synchronization design and lock order to one race site per change, runs the regression test and the stack's detector after every edit, and refuses the fixes that only hide races (sleeps, retries, wider timeouts, skipped tests, disabled detectors).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `sync_design` (object[], required): From `race-sync-primitive-choice`.
- `lock_order_spec` (object, required): From `race-lock-ordering`; may be empty with `empty_reason` set.
- `regression_test` (object, required): From `race-deterministic-regression-test`.

---

## Outputs

- `fix_patch` (object): `test_commit` (hash of the commit holding only the failing regression test), `commits` (one per site: hash, message, files), `diff_stat` (`git diff --stat` per commit), `regression_result` (pass output after the fix), `detector_result` (detector output after the fix), `sites_fixed`, `sites_not_fixed` (with reason).

---

## Phase 1: Prepare a Clean Branch

### Entry Criteria
- `git -C "<repo_path>" status --porcelain` prints nothing except the new regression test file. If other changes exist, stop and ask.

### Actions
1. Create a branch: `git -C "<repo_path>" switch -c fix/race-<short name>`.
2. Confirm the regression test fails right now: run `regression_test.run_command` and check the message matches `fails_before_fix`. If it passes, the tree differs from the one the test was written against; stop.
3. Commit the regression test (and its one-line test hook, if the seam needed one) alone, before any fix: `git add <test file> <hook file>` then `git commit -m "test(race): failing regression for <shared_target>"`. Record the hash as `test_commit`. This commit is the base for the before-and-after check in `race-stress-verify`.
4. Order the work: sites from `sync_design` sorted by the `evidence_rank` they had in `race_sites` (1 first). Lock order changes from `lock_order_spec` go first if any `lock-cycle` site is in the list.

### Output
Branch name and ordered site list.

### Quality Gate
- `git branch --show-current` prints the new branch.
- The regression test fails with the recorded message.

---

## Phase 2: Edit One Site, Then Test

### Entry Criteria
- Ordered site list exists.

### Actions
1. Take the next site. Edit ONLY the files in that site's `all_access_sites` and `critical_section`. Apply the `exact_api` from `sync_design`:
   - wrap exactly the `critical_section` lines (not more, not less),
   - convert every other access in `all_access_sites` to use the same mechanism,
   - for lock order changes, reorder acquisitions per `lock_order_spec.rules` (for same-class locks, compute `first, second` by key comparison before locking),
   - for retry-required database fixes, wrap the whole transaction in a retry loop that catches only the named SQLSTATE or error codes and re-runs from `BEGIN`; the retry limit is the user's value.
2. Show the change: `git -C "<repo_path>" diff --stat` and `git -C "<repo_path>" diff`. The stat must list only files of this site.
3. Build and run, in this order, saving output:
   - compile or type check: `go build ./...`, `mvn -q compile`, `cmake --build build`, `cargo build`, `python -m compileall -q <pkg>` or `mypy` if configured, `npx tsc --noEmit`;
   - `regression_test.run_command`: must pass;
   - the detector for the stack: `go test -race ./<pkg>`, the TSan build test, `cargo +nightly miri test <name>` or the loom test, the jcstress test, `PYTHONASYNCIODEBUG=1 python -X dev -m pytest <file>`, `NODE_OPTIONS=--unhandled-rejections=strict <test command>`;
   - the module's full existing test suite.
4. If all pass, commit just this site: `git add <files>` (list files explicitly; do not use `git add -A`) and `git commit -m "fix(race): <shared_target> <mechanism>"`.
5. If anything fails, read the output, fix only within this site's files, and rerun step 3. Do not move to the next site with a failing state.
6. Repeat for the next site.

### Output
One commit per fixed site.

### Quality Gate
- For each commit, `git show --stat <hash>` lists only that site's files.
- For each commit, saved outputs show the regression test passing and the detector reporting no race for the site.

---

## Phase 3: Refuse Masking Changes

### Entry Criteria
- All sites attempted.

### Actions
1. Check the full branch diff against the base: `git -C "<repo_path>" diff <base>...HEAD`. Reject the branch and redo the site if any of these appear:

| Masking change | How to detect |
|---|---|
| Sleep added to production code | `git diff <base>...HEAD | grep -E "^\+.*(time\.Sleep|Thread\.sleep|time\.sleep|asyncio\.sleep|setTimeout|sleep_for)"` |
| Detector disabled | removed `-race`, `-fsanitize=thread`, `PYTHONASYNCIODEBUG`, `--unhandled-rejections` from CI or scripts; new TSan suppressions for in-repo code; `//go:norace` |
| Test weakened | deleted assertions, `t.Skip`, `@Disabled`, `@pytest.mark.skip`, `it.skip`, `#[ignore]`, added `retryTimes`, `--reruns`, `rerunFailingTestsCount` |
| Timeout widened to hide a hang | increased test or lock timeouts without a lock order change |
| Broad catch | new `except:`, `catch (Throwable`, `.catch(() => {})` that discards errors |
| Lint silenced | new `eslint-disable`, `# noqa`, `@SuppressWarnings` on the changed lines |

2. Run each detection command and save its output; empty output is the pass.
3. Record every site not fixed with the reason in `sites_not_fixed`.

### Output
`fix_patch`.

### Quality Gate
- Every masking detection command printed nothing (outputs saved).
- `sites_fixed` plus `sites_not_fixed` equals the number of rows in `sync_design`.

---

## Worked Example

Illustrative only.

Site 1: `Store.stock`, Mutex, `critical_section` `reserve.go:46-52`, accesses `reserve.go:47,51`, `restock.go:18`, `report.go:20`.

Phase 2: adds `s.mu.Lock(); defer s.mu.Unlock()` at the top of `Reserve`, `Restock` and `Report`. `git diff --stat` lists `inventory/reserve.go`, `inventory/restock.go`, `inventory/report.go` (the test and its hook were committed first as `9f8e7d6 test(race): failing regression for Store.stock`). `go build ./...` ok; `go test -run '^TestReserveLostUpdate$' -count=1 ./inventory` prints `ok`; `go test -race -count=20 ./inventory` prints `ok` with no `WARNING: DATA RACE`; `go test ./...` ok. Commit `a1b2c3d fix(race): Store.stock mutex`.

Phase 3: all six detection commands print nothing.

---

## Exit Criteria

DONE when every site has its own commit that passes the build, the regression test, the stack's detector and the existing suite, and the branch contains no masking change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree has unrelated changes | **Stop**: ask the user to commit or stash them; never stash on their behalf without asking. |
| Phase 2 | Fix causes a new deadlock (regression test hangs) | **Adjust**: the new lock is taken inside another lock; check `lock_order_spec` and add the new lock to the ranks. |
| Phase 2 | Existing unrelated test fails | **Retry**: run it on the base branch; if it fails there too, record it and continue; if it passes there, the fix broke it. |
| Phase 2 | Detector reports a different race | **Return**: record it as a new site for `race-findings-consolidate`; do not widen this commit. |
| Phase 3 | A masking change is found | **Retry**: revert that hunk and redo the site properly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
