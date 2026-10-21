# Bash errexit, nounset and pipefail Pitfalls

**One-line description:** Finds and fixes the specific places where `set -euo pipefail` silently does nothing or kills a correct script: `local x=$(cmd)`, functions called from `if`/`&&`/`||`, `((i++))` at zero, `grep` with no match, `| head` SIGPIPE 141, `read -d ''` at EOF, command substitution without `inherit_errexit`, and empty arrays under `set -u` before bash 4.4.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): The bash script to audit.
- `bash_min_version` (string, required): From `shs-bash-vs-posix-decision`; decides which fixes are available.

---

## Outputs

- `errexit_fixes` (object[]): One entry per finding: line number, pitfall ID (E1 to E9), before line, after line, and the proof command that shows the new behavior.

---

## Phase 1: Locate Pitfall Sites

### Entry Criteria
- `bash -n "$script_path"` exits 0.

### Actions
1. Run each search and record every hit line:

| ID | Pitfall | Search | Why it breaks |
|---|---|---|---|
| E1 | `local`/`declare`/`export`/`readonly` with `$( )` | `grep -nE '^\s*(local\|declare\|export\|readonly)\s+\w+=.*\$\(' "$script_path"` | Exit status is the builtin's (0); the failed substitution is masked. ShellCheck SC2155. |
| E2 | Function called as an `if`/`while` condition or with `&&`/`\|\|` | `grep -nE '(if\|while\|until)\s+!?\s*[a-z_]+\b\|[a-z_]+\s*(&&\|\|\|)' "$script_path"` then keep hits whose word is a function in the file | errexit is disabled for the whole function body, not only its last command. |
| E3 | `((var++))` or `((var--))` or `((expr))` that can be 0 | `grep -nE '\(\(\s*\w+(\+\+\|--)\s*\)\)\|^\s*\(\(' "$script_path"` | `(( ))` returns 1 when the value is 0; `((i++))` with `i=0` exits the script. |
| E4 | `grep` whose no-match is a valid outcome | `grep -nE '\bgrep\b' "$script_path"` | grep exits 1 on no match; with pipefail the whole pipeline fails. |
| E5 | Pipeline into `head`, `grep -q`, `grep -m` | `grep -nE '\\|\s*(head\|grep -q\|grep -m)' "$script_path"` | Reader exits early, writer gets SIGPIPE, status 141, pipefail fails the pipeline intermittently. |
| E6 | `read -r -d ''` from a here-doc, or `read` of a last line with no newline | `grep -nE "read .*-d ''" "$script_path"` | `read` returns 1 at EOF, which exits under `-e`. |
| E7 | Command substitution relied on to stop the script | `grep -nE '\$\(' "$script_path"` | Without `shopt -s inherit_errexit` (bash 4.4+), a failing command in the middle of `$( )` does not stop the subshell. |
| E8 | `"${arr[@]}"` that can be empty | `grep -nE '"\$\{\w+\[@\]\}"' "$script_path"` | bash before 4.4 reports "unbound variable" under `set -u`. |
| E9 | `$1`, `$2`, or optional env vars read without default | `grep -nE '\$\{?[0-9]\b\|\$\{?[A-Z_]+\}?' "$script_path"` | `set -u` exits with "unbound variable" when unset. |

2. Read each hit in context (5 lines around it) and drop false positives. Write down why each kept hit is real.

### Output
List of confirmed pitfall sites.

### Quality Gate
- Each of E1 to E9 has either confirmed sites or "none found" written next to it.
- Every confirmed site has a line number.

---

## Phase 2: Apply the Fix for Each Site

### Entry Criteria
- Confirmed site list exists.

### Actions
1. Fix ONE site at a time, then run `bash -n "$script_path"` before moving on. Do not batch edits across the file.
2. Use the matching replacement:

| ID | Replace with |
|---|---|
| E1 | `local out` on one line, `out=$(cmd)` on the next. |
| E2 | Inside any function that is used as a condition or with `&&`/`\|\|`, append `\|\| return 1` to every command that can fail, because errexit will not stop it there. If the function does not need to be a condition, call it on its own line instead. |
| E3 | `i=$((i + 1))`. For a test, use `if (( i > 0 )); then`. |
| E4 | When no-match is OK: `grep pat file \|\| true` scoped to that command, or `if grep -q pat file; then`. When you need to tell "no match" (1) from "error" (2): `rc=0; grep pat file \|\| rc=$?; if (( rc > 1 )); then exit "$rc"; fi`. |
| E5 | Capture first, then trim: `out=$(producer); first=${out%%$'\n'*}`; or tolerate 141 explicitly: `{ producer \|\| [ $? -eq 141 ]; } \| head -n 1`. |
| E6 | `IFS= read -r -d '' var <<'EOF' \|\| true` for here-docs; for line loops use `while IFS= read -r line \|\| [[ -n $line ]]; do`. |
| E7 | If `bash_min_version` >= 4.4: keep `shopt -s inherit_errexit`. Else assign the substitution to a variable on its own line (`x=$(cmd)`), whose status the shell does check. |
| E8 | If `bash_min_version` >= 4.4: no change. Else `${arr[@]+"${arr[@]}"}`. |
| E9 | `${1:-}`, `${VAR:-default}`, or `: "${VAR:?VAR must be set}"` when it is mandatory. |

3. Do NOT remove `set -e`, `set -u` or `set -o pipefail` to make a pitfall go away. Do NOT add a blanket `|| true` to a whole pipeline or function call.

### Output
Edited script and draft `errexit_fixes`.

### Quality Gate
- `bash -n "$script_path"` exits 0 after every single edit.
- `grep -c 'set -Eeuo pipefail\|set -euo pipefail' "$script_path"` still prints `1`.

---

## Phase 3: Prove Each Fix

### Entry Criteria
- All sites edited.

### Actions
1. For each pitfall ID fixed, run its proof snippet and paste the output:
   - E1: `bash -c 'set -e; f(){ local x=$(false); echo survived; }; f'` prints `survived` (bug shown); the fixed form `bash -c 'set -e; f(){ local x; x=$(false); echo survived; }; f; echo rc=$?'` prints nothing from `f` and the shell exits 1.
   - E3: `bash -c 'set -e; i=0; ((i++)); echo reached'` prints nothing (bug shown).
   - E5: `bash -c 'set -o pipefail; yes | head -n 1; echo "rc=${PIPESTATUS[0]}"'` shows `rc=141`.
2. Run the script's normal path once and record the exit code.

### Output
`errexit_fixes` with proof output.

### Quality Gate
- Every entry in `errexit_fixes` has a proof command and its pasted output.
- The normal run exits 0.

---

## Worked Example

Illustrative only.

Input: a 60-line bash 4.4 script. Phase 1 finds E1 at line 22 (`local files=$(find "$dir" -name '*.log')`), E3 at line 31 (`((count++))`), E5 at line 40 (`ls -t | head -n 1`).

Phase 2 edits: line 22 becomes two lines; line 31 becomes `count=$((count + 1))`; line 40 becomes `newest=$(ls -t); newest=${newest%%$'\n'*}`.

Phase 3:
```
$ bash -c 'set -e; i=0; ((i++)); echo reached'; echo "rc=$?"
rc=1
$ ./bin/rotate --dry-run; echo "rc=$?"
rc=0
```

---

## Exit Criteria

DONE when every E1 to E9 site is fixed or recorded as "none found", strict mode lines are intact, and the normal run exits 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Search finds hundreds of hits | **Adjust**: process one function at a time; record which functions are done. |
| Phase 2 | A fix changes the script's output | **Stop**: revert that one edit and record the behavior difference; the old behavior may be relied on. |
| Phase 3 | Normal run now exits nonzero | **Retry**: run `bash -x` and find the newly exposed failing command; it was failing silently before. Fix its cause, do not mask it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
