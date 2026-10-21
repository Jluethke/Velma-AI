# Prove the Test Guards the Fix (Revert Check)

**One-line description:** Proves the regression test actually detects the bug by reverting only the source fix (keeping the test), confirming red with the original signature, restoring the fix, confirming green on every repeated run, and checking that each hunk of the fix is needed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_diff` (object, required): Output of `repro-minimal-fix`.
- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `confirm_runs` (integer, required): Number of repeated runs for each state; a user input.

---

## Outputs

- `revert_proof` (object): Three tables of runs (fix reverted, fix restored, per-hunk removal) with exit codes and signature matches, and the verdict `GUARDED` or `NOT GUARDED` with the reason.

---

## Phase 1: Revert the Source Fix Only

### Entry Criteria
- Working tree clean (`git status --porcelain` empty).
- `fix_diff` lists the source paths it changed.

### Actions
1. Revert only the source paths to their pre-fix state, leaving the test in place: `git checkout <base commit> -- <source path 1> <source path 2>` where `<base commit>` is the parent of the fix (`git rev-parse HEAD~1` if the fix is one commit, or the merge base `git merge-base HEAD <main branch>`).
2. Confirm the test file is still the fixed version: `git diff HEAD --name-only` lists only the source paths.
3. Run the regression test `confirm_runs` times. Each run must exit non-zero with the original signature line from `regression_test` (`grep -F`).

### Output
Reverted-state run table.

### Quality Gate
- Every reverted-state run is red with the original signature; the count equals `confirm_runs`.

---

## Phase 2: Restore and Repeat Green

### Entry Criteria
- Reverted-state runs all red.

### Actions
1. Restore the fix: `git checkout HEAD -- <source paths>`; `git status --porcelain` must be empty.
2. Run the regression test `confirm_runs` times with the same command and environment prefix (seed, `TZ`, sanitizer flags). Each run must pass.
3. For intermittent bugs (where `repro-nondeterminism-pin` recorded a rate below every run), also run the test under the pinned conditions that made it fail (for example `PYTHONHASHSEED=3`, `go test -race -count=<confirm_runs>`, `--gtest_repeat=<confirm_runs>` for GoogleTest, `--test-threads=1`).

### Output
Restored-state run table.

### Quality Gate
- Every restored-state run passes; the count equals `confirm_runs`.

---

## Phase 3: Each Hunk Is Needed

### Entry Criteria
- `fix_diff` has more than one hunk. If it has one hunk, record "single hunk" and skip to the verdict.

### Actions
1. For each hunk, reverse-apply just that hunk: save it with `git diff HEAD~1 HEAD -- <file>` and edit a copy down to one hunk, then `git apply -R <hunk.patch>`; or use `git checkout -p HEAD~1 -- <file>` and answer `y` only for that hunk.
2. Run the regression test once and record the result. Restore with `git checkout HEAD -- <file>`.
3. A hunk whose removal keeps the test green is not needed for this bug. Record it; it belongs in a separate change or needs its own test. Report it back to `repro-minimal-fix` for removal.
4. Verdict: `GUARDED` if Phase 1 was all red, Phase 2 all green, and every hunk is needed (or single hunk). Otherwise `NOT GUARDED` with the failing check.

### Output
`revert_proof`.

### Quality Gate
- `git status --porcelain` is empty at the end.
- Verdict is `GUARDED` or `NOT GUARDED` with a named failing check.

---

## Worked Example

Illustrative only. `confirm_runs` = 10; fix is one commit touching `src/importer/encoding.py` with two hunks (LE check, BE check).

- Phase 1: `git checkout HEAD~1 -- src/importer/encoding.py`; 10 runs, all exit 1 with `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff`.
- Phase 2: restored; 10 runs, all `1 passed`.
- Phase 3: removing the BE hunk keeps the LE regression test green, so the BE hunk is not guarded. Action: add a second parametrized case for FE FF input in the test flow, then rerun. With the case added, removing either hunk turns a case red. Verdict `GUARDED`.

---

## Exit Criteria

DONE when the verdict is `GUARDED`: the test is red without the fix on every run, green with it on every run, and every hunk is needed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test passes with the fix reverted | **Stop**: the test does not guard the bug; return to the stack test flow. |
| Phase 1 | Reverted source fails to compile because the test uses a new API from the fix | **Adjust**: the test depends on the fix's API; rewrite the test against the pre-existing API so it can be red before the fix. |
| Phase 2 | Some restored runs fail | **Return**: to `repro-minimal-fix`; the fix is incomplete or the test is flaky. |
| Phase 3 | Unneeded hunk found | **Return**: to `repro-minimal-fix` to remove it, or add a test case that needs it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
