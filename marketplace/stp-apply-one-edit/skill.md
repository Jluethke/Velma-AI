# Apply Exactly One Edit and Prove Only One Hunk Changed

**One-line description:** Applies the next locked edit as a single exact-string replacement, then proves with `git diff --stat` and `git diff -U0` against the staged checkpoint that exactly one file and one hunk changed, with no line-ending, indentation or whole-file rewrites, before any verify command runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `locked_plan` (object[], required): From `stp-edit-plan-lock`.
- `stop_decision` (object, optional): From `stp-stop-or-continue` on a loop pass. Absent on the first pass. Its `next_edit_id` and `retry_note` select and adjust the edit.
- `start_commit` (object, required): From `stp-scratch-log-start` (`is_git`, `backup_dir`).
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `applied_edit` (object): `{ "id": str, "file": str, "attempt": int, "diff": str, "hunks": int, "files_changed": int, "verify": [str], "expected_signal": str }`.

---

## Phase 1: Select the Edit and Check the Starting State

### Entry Criteria
- `locked_plan` is non-empty.

### Actions
1. Select the edit:
   - First pass (no `stop_decision`): the first edit in `locked_plan`.
   - Loop pass: the edit whose `id` equals `stop_decision.next_edit_id`. If `stop_decision.retry_note` is present, it names a corrected `new_text` that must come from a re-locked plan; if the plan was not re-locked, **stop** and run `stp-edit-plan-lock` first.
2. Count attempts: `attempt` = 1 + the number of `EDIT <id>` lines already in `scratch_log` for this id (`rg -c "^.*EDIT <id> " <scratch_log>`).
3. Checkpoint rule (git): every previously kept edit was staged with `git add <file>` by `stp-keep-or-revert-edit`. So `git diff` (working tree versus index) must be empty for the edit's file now. Run `git -C <repo_path> diff --quiet -- <file>`; exit 0 is required.
4. Non-git: copy the file to `backup_dir` as `<file name>.<id>.a<attempt>.bak` before editing.
5. Append to `scratch_log`: `<UTC time> EDIT <id> attempt <attempt> file <file>`.

### Output
Selected edit and attempt number.

### Quality Gate
- `git diff --quiet -- <file>` exits 0 before the edit (or the backup copy exists for non-git).

---

## Phase 2: Make the One Replacement

### Entry Criteria
- Phase 1 passed.

### Actions
1. Confirm `old_text` is still present exactly once: `rg -c -F "<first line of old_text>" <file>` prints `1`. If it prints 0, an earlier edit changed this area; **stop** and return to `stp-edit-plan-write` for this edit.
2. Replace `old_text` with `new_text` using one exact-string replacement:
   - Preferred: an editor tool that replaces one exact string and fails if it is not unique.
   - Shell alternative: write the edit as a unified diff file and run `git apply --check <patch>` then `git apply <patch>`. `--check` validates without changing anything.
3. Do NOT use these, which commonly break files: `sed -i` with a regex across files, `perl -pi -e` on globs, rewriting the whole file from memory, PowerShell `Set-Content` of a whole file (it can change the encoding and line endings; Windows PowerShell 5.1 writes UTF-16 LE by default with `Out-File`), or running a formatter on the whole file.
4. New file (empty `old_text`): create it with `new_text`, then run `git -C <repo_path> add -N -- <file>` (intent to add). Without that, an untracked file never appears in `git diff` and Phase 3 cannot see it.
5. Do not touch any other file. Do not "also fix" anything you noticed.

### Output
The file with one replacement.

### Quality Gate
- `rg -c -F "<first line of new_text>" <file>` prints at least `1`.
- `rg -c -F "<first line of old_text>" <file>` prints `0`, unless the first line of `old_text` is repeated in `new_text` (pure insertion), in which case it prints `1`.

---

## Phase 3: Prove the Change Is One Hunk in One File

### Entry Criteria
- Replacement made.

### Actions
1. Run `git -C <repo_path> diff --stat`. Ignore files listed in `start_commit.dirty_files` (the user's pre-existing changes). Apart from those, it must list exactly one file: the edit's file. Set `files_changed` to that count.
2. Run `git -C <repo_path> diff -U0 -- <file>`. Count lines starting with `@@`; that is `hunks`. It must be 1 (2 is allowed only for an edit that `stp-decompose-small-edits` merged on purpose, which says so in its purpose).
3. Line-ending and whitespace trap: if the stat shows far more changed lines than `old_text` plus `new_text`, run `git diff --stat --ignore-cr-at-eol -- <file>` and `git diff --stat -w -- <file>`. If the count drops to the expected size, the edit changed line endings or indentation across the file. Revert (`git restore -- <file>`) and redo the replacement preserving the original line endings.
4. Encoding trap: `git diff` printing `Binary files differ` for a text file means the encoding changed (for example to UTF-16). Revert and redo.
5. Store the `git diff -U0 -- <file>` output in `diff`. Append it to `scratch_log` under the EDIT line.
6. Copy `verify` and `expected_signal` from the plan entry into `applied_edit`.

### Output
`applied_edit`.

### Quality Gate
- `files_changed` is 1 (not counting `start_commit.dirty_files`) and the file is the plan's file.
- `hunks` is 1 (or 2 with the documented merge).
- The added and removed line counts in `git diff --numstat -- <file>` equal the line counts of `new_text` and `old_text` minus shared lines.

---

## Worked Example

Illustrative only.

Edit E3 on `slugkit/core.py`, attempt 1, E1 and E2 already staged.

```
$ git diff --quiet -- slugkit/core.py; echo $?
0
$ git diff --stat
 slugkit/core.py | 2 ++
 1 file changed, 2 insertions(+)
$ git diff -U0 -- slugkit/core.py
@@ -15,0 +16,2 @@ def slugify(text: str, sep: str = "-") -> str:
+    text = unicodedata.normalize("NFKD", text)
+    text = text.encode("ascii", "ignore").decode("ascii")
```

`files_changed` 1, `hunks` 1, numstat `2 0 slugkit/core.py` matches two added lines (the regex line was shared between `old_text` and `new_text`).

---

## Exit Criteria

DONE when exactly one planned replacement is in the working tree, the diff against the staged checkpoint is one file and one hunk, and the diff is in the scratch log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | File already differs from the index before editing | **Stop**: something outside the loop changed it; report `git diff -- <file>` and do not overwrite. |
| Phase 2 | `old_text` not found | **Return**: to `stp-edit-plan-write` for this edit; do not guess a nearby line. |
| Phase 2 | `git apply --check` fails | **Adjust**: regenerate the patch from the current file with correct context lines. |
| Phase 3 | More than one file in `git diff --stat` | **Stop**: revert every file that is not the edit's file with `git restore -- <path>`, only if it is not in the pre-existing dirty list; then retry. |
| Phase 3 | Whole-file change from line endings | **Retry**: revert and redo the replacement once, preserving line endings. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
