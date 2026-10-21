# Find the Breaking Commit with git bisect run

**One-line description:** Automates `git bisect run` with the minimal repro as the test command, mapping build failures to exit 125 (skip), handling merge-heavy history with `--first-parent`, and reports the first bad commit with its diff and the bisect log for replay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`; its script exits 0 (good), 1 (bug present) or 2 (other failure).
- `repo_path` (string, required): Absolute path to the local clone.
- `good_ref` (string, required): A commit, tag or branch where the bug is absent (the last known good version from the reporter).
- `bad_ref` (string, required): A commit, tag or branch where the bug is present (usually the reported version or `HEAD`).

---

## Outputs

- `first_bad_commit` (object): SHA, author, date, subject, the full `git show --stat` output, and the exit code of the repro on that commit and on its parent.
- `bisect_log` (string): The verbatim output of `git bisect log`, which can be replayed with `git bisect replay`.

---

## Phase 1: Verify the Endpoints

### Entry Criteria
- `git -C <repo_path> status --porcelain` shows no modified tracked files. Stash first with `git stash push -m repro-bisect` if needed; never bisect with uncommitted changes.

### Actions
1. Copy the repro script to a path outside the work tree (for example `/tmp/repro-bisect.sh` or `%TEMP%\repro-bisect.sh`), because `git bisect` checks out old commits and `.repro/` content tracked or not must not change between steps. Also copy the minimal input fixture next to it and point the script at the absolute path.
2. Check the good end: `git -C <repo_path> checkout --detach <good_ref> && bash /tmp/repro-bisect.sh; echo $?` must print `0`.
3. Check the bad end: `git -C <repo_path> checkout --detach <bad_ref> && bash /tmp/repro-bisect.sh; echo $?` must print `1`.
4. Return to the original branch: `git -C <repo_path> checkout -`.
5. Count candidate commits: `git -C <repo_path> rev-list --count <good_ref>..<bad_ref>`; bisect needs about log2 of that many steps.

### Output
Verified endpoints.

### Quality Gate
- Good end printed `0` and bad end printed `1`, with the outputs pasted.

---

## Phase 2: Write the Bisect Wrapper

### Entry Criteria
- Endpoints verified.

### Actions
1. Write `/tmp/bisect-step.sh` that:
   1. Builds the commit with the stack build command from `minimal_repro`. If the build fails, `exit 125` (git bisect skips the commit).
   2. Runs `/tmp/repro-bisect.sh`, stores `rc=$?`.
   3. Maps: `rc == 0` to `exit 0` (good), `rc == 1` to `exit 1` (bad), anything else to `exit 125` (skip).
2. Never let the wrapper exit with a code of 128 or more for an ordinary failure: `git bisect run` aborts the whole bisect on codes above 127 (see `git help bisect`, section "Bisect run"). A segfault killing the script directly yields 139; that is why the wrapper captures `rc` and maps it.
3. Make it executable: `chmod +x /tmp/bisect-step.sh`.
4. Decide on history mode:

| History shape | Command |
|---|---|
| Linear or squash-merged | `git bisect start <bad_ref> <good_ref>` |
| Many merge commits from long-lived branches, and you want the merge that introduced the bug into mainline | `git bisect start --first-parent <bad_ref> <good_ref>` (git 2.29 or later; check `git --version`) |
| Bug only in a subdirectory | add `-- <path>` to limit candidates to commits touching that path |

### Output
Wrapper script and chosen start command.

### Quality Gate
- `bash /tmp/bisect-step.sh; echo $?` on the bad end prints `1` and on the good end prints `0`.

---

## Phase 3: Run and Confirm

### Entry Criteria
- Wrapper verified.

### Actions
1. Run: `git -C <repo_path> bisect start <chosen flags> <bad_ref> <good_ref>` then `git -C <repo_path> bisect run /tmp/bisect-step.sh`.
2. Read the result line `<sha> is the first bad commit`. If the output says "There are only 'skip'ped commits left to test", record the listed candidate range instead of a single commit.
3. Save the log: `git -C <repo_path> bisect log > /tmp/bisect.log`; paste it into `bisect_log`.
4. End the session: `git -C <repo_path> bisect reset`. This returns HEAD to where you started. Restore any stash with `git stash pop`.
5. Confirm: check out the first bad commit, run the repro (expect 1); check out its parent `<sha>^` (expect 0). For a merge commit found with `--first-parent`, the parent is `<sha>^1`.
6. Record `git show --stat <sha>` and the full diff of the files on the failing path into `first_bad_commit`.

### Output
`first_bad_commit`, `bisect_log`.

### Quality Gate
- `git -C <repo_path> bisect log` output was saved before `bisect reset`.
- Confirmation runs show exit 1 on the commit and exit 0 on its parent.
- `git -C <repo_path> status` after reset shows the original branch.

---

## Worked Example

Illustrative only. Rust CLI, `good_ref` = `v1.8.0`, `bad_ref` = `v1.9.0`, 143 commits between.

```
$ git bisect start v1.9.0 v1.8.0
$ git bisect run /tmp/bisect-step.sh
running '/tmp/bisect-step.sh'
...
Bisecting: 0 revisions left to test after this (roughly 0 steps)
3f9c2e1 is the first bad commit
commit 3f9c2e1...
    parser: switch number parsing to lexical-core
bisect found first bad commit
```

Eight steps, one skipped (build broken by an unrelated dependency bump, exit 125). Confirmation: `3f9c2e1` exits 1, `3f9c2e1^` exits 0. `bisect_log` saved, then `git bisect reset`.

---

## Exit Criteria

DONE when one first bad commit (or a recorded skip range) is confirmed by running the repro on it and its parent, and the bisect log is saved.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Good end also fails | **Return**: the bug predates `good_ref`; ask for an older good version or check an older tag yourself. |
| Phase 1 | Repro script missing on old commits | **Adjust**: that is why it lives outside the work tree; copy it out and rerun. |
| Phase 2 | Old commits need a different toolchain | **Adjust**: pin the toolchain per commit inside the wrapper (read `.nvmrc`, `rust-toolchain.toml`, `go.mod` at each step) or skip with 125. |
| Phase 3 | Bisect lands on a huge merge or formatting commit | **Adjust**: rerun without `--first-parent` inside that merge's branch range (`<merge>^1..<merge>^2`). |
| Phase 3 | Bisect aborted with "exit code above 127" | **Retry**: fix the wrapper mapping; never let a crash code pass through. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
