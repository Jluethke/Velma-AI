# Start the Scratch Log and Pin the Starting Commit

**One-line description:** Records the exact starting commit and working-tree state, and creates an append-only scratch log inside `.git/stp/` (never committed, never shown by `git status`), so every later edit, command and result has a written trail and a clean point to return to.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `scope_limits` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `scratch_log` (string): Absolute path of the scratch log file, for example `/work/slugkit/.git/stp/scratch.md`.
- `start_commit` (object): `{ "sha": str, "branch": str, "dirty_files": [str], "is_git": bool, "backup_dir": str|null }`.

---

## Phase 1: Read the Repository State

### Entry Criteria
- `goal_check.command` is non-empty.

### Actions
1. Run `git -C <repo_path> rev-parse --show-toplevel`.
   - Exit 0: set `is_git` true and continue.
   - Non-zero ("not a git repository"): set `is_git` false and go to step 5.
2. Run `git -C <repo_path> rev-parse HEAD` and store the 40-character output as `sha`. If it fails with "ambiguous argument 'HEAD'", the repo has no commits; set `sha` to `NO_COMMITS` and record it.
3. Run `git -C <repo_path> branch --show-current` and store the output as `branch` (empty output means detached HEAD; store `DETACHED`).
4. Run `git -C <repo_path> status --porcelain=v1`. Every output line is `XY path`. Store each path in `dirty_files`.
5. If `is_git` is false: create a backup directory outside the repository (for example `<repo_path>/../<repo name>.stp-backup/`) and set `backup_dir` to it. Before any later edit, the file being edited is copied there first.

### Output
`start_commit` filled in.

### Quality Gate
- `sha` is 40 hex characters, or `NO_COMMITS`, or `is_git` is false.
- `dirty_files` equals the path column of `git status --porcelain=v1` output (empty list when the output is empty).

---

## Phase 2: Handle a Dirty Working Tree

### Entry Criteria
- `dirty_files` is non-empty.

### Actions
1. Apply this table to each dirty file:

| Dirty file is... | Do this |
|---|---|
| listed in `scope_limits.in_scope` | **Stop**. You cannot tell your edits from the user's. Ask the user to commit or stash first. |
| not in scope | Record it under "Pre-existing changes, do not touch" in the log. Never run `git restore`, `git checkout --`, `git stash` or `git clean` on it. |

2. Never run `git stash`, `git reset --hard` or `git clean -fd` to "clean up". Those commands destroy or hide the user's work.

### Output
Dirty files classified.

### Quality Gate
- No dirty file is in `scope_limits.in_scope`, or the flow stopped.

---

## Phase 3: Create the Scratch Log

### Entry Criteria
- Phase 1 complete (and Phase 2 passed if it ran).

### Actions
1. If `is_git`: create the directory `<repo_path>/.git/stp/`. Files under `.git/` are never committed and never listed by `git status`. If not `is_git`: put the log in `backup_dir`.
2. Create `scratch.md` there with this exact header, filled in:

```
# STP scratch log
Goal: <goal_check.goal_sentence>
Check: <goal_check.command>   (cwd: <goal_check.cwd>)
Pass signal: exit 0 and contains "<goal_check.pass_signal.must_contain>"
Start commit: <sha> on <branch>
Pre-existing changes, do not touch: <dirty_files or "none">
In scope: <scope_limits.in_scope, one per line>
Out of scope: <scope_limits.out_of_scope, one per line>
Stop triggers: <scope_limits.stop_triggers, one per line>

## Entries
```

3. Write the logging rules at the bottom of your working notes and follow them for the rest of the chain:
   - Append only. Never edit or delete an earlier entry.
   - Write the entry for a command BEFORE running it (`RUN: <command>`), then append `EXIT: <code>` and `FIRST ERROR: <line or none>` after.
   - Every claim in the final report must point to a line in this log or a log file next to it.
4. Append the first entry: `<UTC time> START sha=<sha>`. Get the time with `date -u +%Y-%m-%dT%H:%M:%SZ` (bash) or `(Get-Date).ToUniversalTime().ToString("s")` (PowerShell).

### Output
`scratch_log` path.

### Quality Gate
- `git -C <repo_path> status --porcelain=v1` output is identical to the output from Phase 1 step 4 (the log did not dirty the tree).
- The log file's first line is `# STP scratch log` and its last line starts with a timestamp and `START`.

---

## Worked Example

Illustrative only.

Input: `repo_path` = `/work/slugkit`, goal from `stp-goal-to-runnable-check`.

- Phase 1:
```
$ git -C /work/slugkit rev-parse HEAD
9f2c4e1a7b3d5c6e8f0a1b2c3d4e5f60718293a4
$ git -C /work/slugkit branch --show-current
fix/accents
$ git -C /work/slugkit status --porcelain=v1
 M README.md
```
- Phase 2: `README.md` is not in scope, so it is recorded under "Pre-existing changes, do not touch".
- Phase 3: `/work/slugkit/.git/stp/scratch.md` is created. `git status --porcelain=v1` still prints only ` M README.md`. Last log line: `2026-10-20T14:02:11Z START sha=9f2c4e1`.

---

## Exit Criteria

DONE when `start_commit` is recorded, no in-scope file is dirty, and `scratch_log` exists without changing `git status` output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `git` is not installed | **Adjust**: set `is_git` false and use the backup directory method. |
| Phase 1 | Repo has no commits | **Adjust**: record `NO_COMMITS`; reverts in later flows use the backup copies. |
| Phase 2 | An in-scope file has uncommitted changes | **Stop**: ask the user to commit or stash; do not do it for them. |
| Phase 3 | `.git` is a file (worktree or submodule) | **Adjust**: run `git rev-parse --git-dir` and create `stp/` inside the directory it prints. |
| Phase 3 | `git status` changed after creating the log | **Retry**: delete only the log you just created, and create it under the path from `git rev-parse --git-dir`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
