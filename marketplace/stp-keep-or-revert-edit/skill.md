# Keep the Edit or Revert It to the Last Good Checkpoint

**One-line description:** Decides with a fixed table whether the just-applied edit stays (staged with `git add` as the new checkpoint) or is reverted (`git restore` from the index, or the backup copy outside git), compares failures against the baseline so pre-existing failures are not blamed on the edit, and forbids fixing forward on top of a failing edit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`.
- `applied_edit` (object, required): From `stp-apply-one-edit`.
- `py_error_diagnosis` (object, optional): From `stp-py-read-traceback`.
- `node_error_diagnosis` (object, optional): From `stp-node-read-errors`.
- `go_error_diagnosis` (object, optional): From `stp-go-read-errors`.
- `rust_error_diagnosis` (object, optional): From `stp-rust-read-errors`.
- `java_error_diagnosis` (object, optional): From `stp-java-read-errors`.
- `baseline_report` (object, required): From `stp-baseline-capture`.
- `start_commit` (object, required): From `stp-scratch-log-start` (`is_git`, `backup_dir`, `dirty_files`).
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `edit_outcome` (object): `{ "edit_id": str, "attempt": int, "decision": "KEEP"|"REVERT", "goal_passed": bool, "cause_class": str|null, "first_error": str|null, "diagnosis": object|null, "checkpoint_clean": bool }`.

---

## Phase 1: Decide

### Entry Criteria
- `verify_result.edit_id` equals `applied_edit.id`.

### Actions
1. Take the one diagnosis input that is present (none when everything passed).
2. For each failing run, compare its `first_error` with `baseline_report`: if the same line (same test id, or same `file:line code`) is in `preexisting_failures` AND the failing location is not in `applied_edit.file`, mark that run "baseline, not caused by this edit".
3. Apply the first matching row:

| Condition | `decision` |
|---|---|
| `verify_result.matches_expected_signal` is true | KEEP |
| diagnosis `cause_class` is EXPECTED_INTERMEDIATE | KEEP |
| every failing run is marked "baseline, not caused by this edit" and L0 passed | KEEP |
| diagnosis `cause_class` is TEST_SELECTOR_WRONG and L0 passed | KEEP the edit; record that the card must be fixed before the next run |
| anything else | REVERT |

4. Never choose a third option. In particular, never apply another edit on top of a failing one to "fix forward": two unverified changes in the tree make the next error impossible to attribute.

### Output
`decision`.

### Quality Gate
- `decision` comes from exactly one table row, and that row is written into `scratch_log` with the decision.

---

## Phase 2: Execute the Decision

### Entry Criteria
- Decision made.

### Actions
1. KEEP (git): `git -C <repo_path> add -- <applied_edit.file>`. The index is now the checkpoint for the next edit. Do not commit unless the user asked; staging is enough and is reversible with `git restore --staged`.
2. KEEP (no git): copy the edited file to `backup_dir` as `<name>.<id>.kept`; this is the new checkpoint.
3. REVERT (git, tracked file): `git -C <repo_path> restore -- <applied_edit.file>`. This copies the file from the index (the last kept state) into the working tree. On Git older than 2.23 (`git --version`), use `git -C <repo_path> checkout -- <applied_edit.file>`.
4. REVERT (git, new file created by this edit with `git add -N`): `git -C <repo_path> rm --cached --quiet -- <file>` then delete the file (`rm <file>` or `Remove-Item <file>`). Delete only that file.
5. REVERT (no git): copy the latest `.kept` or the original `.bak` back over the file.
6. Never use `git reset --hard`, `git checkout .`, `git restore .`, `git clean` or `git stash` here. They act on more than one file and can destroy the user's pre-existing changes.

### Output
Working tree at the intended checkpoint.

### Quality Gate
- After KEEP: `git -C <repo_path> diff --quiet -- <file>` exits 0 and `git diff --cached --stat -- <file>` lists the file.
- After REVERT: `git -C <repo_path> diff --quiet -- <file>` exits 0 (working tree equals the last checkpoint).
- `git status --porcelain=v1` shows no file changed by this flow other than `applied_edit.file`.

---

## Phase 3: Record

### Entry Criteria
- Phase 2 gates passed.

### Actions
1. Fill `edit_outcome`: `checkpoint_clean` = true when the Phase 2 gates passed; copy `goal_passed` from `verify_result`, and `cause_class`, `first_error` and the diagnosis.
2. Append to `scratch_log`: `<UTC time> <KEEP|REVERT> <id> a<attempt> cause=<cause_class or none> first_error="<line>"`.

### Output
`edit_outcome`.

### Quality Gate
- `scratch_log` ends with a KEEP or REVERT line for this edit and attempt.

---

## Worked Example

Illustrative only.

E3 attempt 1 in slugkit failed with `AttributeError ... 'strip_accents'` (API_WRONG). Attempt 2 passed.

```
# attempt 1: REVERT
$ git restore -- slugkit/core.py
$ git diff --quiet -- slugkit/core.py; echo $?
0
# log: 2026-10-20T14:20:03Z REVERT E3 a1 cause=API_WRONG first_error="E   AttributeError: module 'unicodedata' has no attribute 'strip_accents'"

# attempt 2: KEEP
$ git add -- slugkit/core.py
$ git diff --cached --stat
 slugkit/core.py       | 3 +++
 tests/test_slugify.py | 5 +++++
 2 files changed, 8 insertions(+)
# log: 2026-10-20T14:22:41Z KEEP E3 a2 cause=none first_error=""
```

The L4 baseline failure `tests/test_cli.py::test_version_flag` is not on this edit's card levels, so it does not affect the decision.

---

## Exit Criteria

DONE when the edit is either staged as the new checkpoint or removed so the file equals the last checkpoint, the working tree contains no other change from this flow, and the decision is logged with its table row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No diagnosis input but a run failed | **Stop**: run the stack's error-reading flow first. |
| Phase 2 | `git restore` reports "pathspec did not match" | **Adjust**: the file is new; use the new-file revert in step 4. |
| Phase 2 | `git diff --quiet` still non-zero after revert | **Stop**: report `git diff -- <file>`; do not try broader git commands. |
| Phase 2 | File is in `start_commit.dirty_files` | **Stop**: it was dirty before the chain; reverting would destroy user work. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
