# Line Endings and Executable Bit in Git

**One-line description:** Fixes the two repository-level reasons a correct script fails after a Windows checkout or a fresh clone: CRLF line endings (`$'\r': command not found`, `/usr/bin/env: 'bash\r'`) via `.gitattributes` `eol=lf` and `git add --renormalize`, and a missing executable bit (`Permission denied`) via `git update-index --chmod=+x`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script inside the repository.
- `repo_dir` (string, required): Git repository root.

---

## Outputs

- `repo_hygiene_report` (object): Line ending found and fixed, `.gitattributes` lines added, git file mode before and after.

---

## Phase 1: Diagnose

### Entry Criteria
- `git -C "$repo_dir" rev-parse --is-inside-work-tree` prints `true`.

### Actions
1. Line endings in the working copy: `file "$script_path"`. "with CRLF line terminators" means CRLF. Without `file`, use `grep -c $'\r' "$script_path"` in bash (nonzero count means CRLF).
2. Line endings in the index: `git -C "$repo_dir" ls-files --eol -- "$script_path"`. Columns are index (`i/lf` or `i/crlf`), working tree (`w/...`) and attributes (`attr/...`).
3. File mode in the index: `git -C "$repo_dir" ls-files -s -- "$script_path"`. `100755` is executable, `100644` is not.
4. Windows clients: `git config core.autocrlf` and `git config core.fileMode`. With `core.fileMode=false` (the Windows default), `chmod` in the working copy does not change git's recorded mode.

### Output
Diagnosis.

### Quality Gate
- All four outputs are pasted into `repo_hygiene_report`.

---

## Phase 2: Fix Line Endings

### Entry Criteria
- Diagnosis shows CRLF anywhere, or no `eol` attribute for shell files.

### Actions
1. Add or extend `.gitattributes` in `repo_dir` (create it if absent; if it exists, append only the missing lines):

```
*.sh   text eol=lf
*.bash text eol=lf
*.bats text eol=lf
bin/*  text eol=lf
```

   Adjust `bin/*` to the directory that holds extensionless scripts. Leave `*.ps1` and `*.bat` alone unless the user asks; `*.bat` and `*.cmd` need CRLF.
2. Renormalize the index: `git -C "$repo_dir" add --renormalize .`, then `git -C "$repo_dir" status --short` to see which files changed.
3. Fix the working copy of the script. With no uncommitted edits in it, restore it from the renormalized index: `rm -- "$script_path" && git -C "$repo_dir" checkout -- "$script_path"`. If uncommitted edits exist, convert in place: `sed 's/\r$//' "$script_path" > "$script_path.tmp" && mv -- "$script_path.tmp" "$script_path"` (`dos2unix` also works if installed).
4. Do NOT set `core.autocrlf` globally as the fix; it is per-machine and other clones will still break. `.gitattributes` travels with the repository.

### Output
`.gitattributes` and renormalized files.

### Quality Gate
- `git ls-files --eol -- "$script_path"` shows `i/lf` and `attr/text eol=lf`.
- `file "$script_path"` no longer mentions CRLF.

---

## Phase 3: Fix the Executable Bit

### Entry Criteria
- Index mode is `100644` and the script is meant to be run directly.

### Actions
1. `git -C "$repo_dir" update-index --chmod=+x -- "$script_path"` (works on Windows where `chmod` does not reach the index).
2. On Linux or macOS also `chmod +x "$script_path"` for the working copy.
3. Confirm with `git -C "$repo_dir" ls-files -s -- "$script_path"` showing `100755`.
4. Run the script directly: `"$script_path" -h; echo "rc=$?"`.
5. Do not commit unless the user asked; list the staged changes with `git -C "$repo_dir" diff --cached --stat`.

### Output
`repo_hygiene_report`.

### Quality Gate
- Mode is `100755`.
- Direct run prints usage and `rc=0`, with no `bad interpreter` or `Permission denied`.

---

## Worked Example

Illustrative only.

```
$ ./deploy.sh
/usr/bin/env: 'bash\r': No such file or directory
$ git ls-files --eol -- deploy.sh
i/crlf  w/crlf  attr/                 deploy.sh
$ git ls-files -s -- deploy.sh
100644 3f2a... 0	deploy.sh
```
Add `*.sh text eol=lf` to `.gitattributes`, `git add --renormalize .`, re-checkout, then `git update-index --chmod=+x -- deploy.sh`:
```
$ git ls-files --eol -- deploy.sh
i/lf    w/lf    attr/text eol=lf      deploy.sh
$ git ls-files -s -- deploy.sh
100755 9c41... 0	deploy.sh
$ ./deploy.sh -h; echo "rc=$?"
Usage: deploy.sh [-h] [-n] ENV
rc=0
```

---

## Exit Criteria

DONE when the script is LF in index and working copy, protected by `.gitattributes`, recorded as `100755`, and runs directly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Not a git repository | **Adjust**: skip git steps; convert with `sed 's/\r$//'` and `chmod +x` only. |
| Phase 2 | `.gitattributes` already has a conflicting `*.sh` rule | **Stop**: show both rules to the user; do not delete theirs. |
| Phase 3 | Mode reverts to `100644` after commit on Windows | **Retry**: run `update-index --chmod=+x` after the final `git add`, since a later `add` can reset it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
