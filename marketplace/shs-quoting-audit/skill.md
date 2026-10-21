# Shell Quoting Audit

**One-line description:** Removes word-splitting and glob bugs by quoting every parameter expansion and command substitution, passing argument lists as `"$@"` or bash arrays instead of strings, ending options with `--`, and proving the fix with a file named `a b *` and a value starting with `-`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to audit.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `quoting_fixes` (object[]): Per site: line, rule ID (Q1 to Q8), before, after.

---

## Phase 1: Find Unquoted Expansions

### Entry Criteria
- The script parses (`bash -n` or `dash -n` exits 0).

### Actions
1. Run `shellcheck -s "$shell_dialect" -f gcc -i SC2086,SC2046,SC2068,SC2206,SC2207,SC2048,SC2145,SC2116 "$script_path"` (if `shell_dialect` is `posix`, pass `-s sh`). `-i` limits output to these codes:
   - SC2086 unquoted variable, SC2046 unquoted `$( )`, SC2068 unquoted `$@`, SC2048 unquoted `$*`, SC2206/SC2207 array built from unquoted expansion, SC2145 `"$@"` mixed with a string, SC2116 useless `echo $(...)`.
2. Additionally search for patterns ShellCheck cannot judge:
   - Command strings: `grep -nE '(cmd\|opts\|args\|flags)="[^"]*\s' "$script_path"` (a command or options stored in a scalar string).
   - Missing `--` before user-controlled operands: `grep -nE '\b(rm\|mv\|cp\|ls\|cat\|grep\|chmod\|chown)\b[^|;]*\$' "$script_path"`.
   - `echo` of user data: `grep -nE '\becho\b.*\$' "$script_path"`.
3. Record each site with its rule ID from Phase 2.

### Output
Site list.

### Quality Gate
- The shellcheck command and its full output are saved.
- Every site has a line number and a rule ID.

---

## Phase 2: Apply the Quoting Rules

### Entry Criteria
- Site list exists.

### Actions
1. Fix one site, re-parse, continue. Rules:

| ID | Rule | Wrong | Right |
|---|---|---|---|
| Q1 | Quote every `$var` and `${var}` that is not on the left of `=` or inside `[[ ]]` | `rm $file` | `rm -- "$file"` |
| Q2 | Quote every `$( )` | `cd $(dirname $0)` | `cd -- "$(dirname -- "$0")"` |
| Q3 | Pass all args with `"$@"`, never `$@`, `$*` or `"$*"` | `exec tool $@` | `exec tool "$@"` |
| Q4 | Build a variable command line as an array (bash) or with `set --` (posix), never a string | `opts="-v --name $n"; tool $opts` | bash: `opts=(-v --name "$n"); tool "${opts[@]}"`; posix: `set -- -v --name "$n"; tool "$@"` |
| Q5 | End options with `--` before any operand that comes from input | `grep "$pat" "$f"` | `grep -e "$pat" -- "$f"` |
| Q6 | Print data with `printf`, not `echo` | `echo "$line"` | `printf '%s\n' "$line"` (echo mangles `-n`, `-e` and backslashes depending on shell) |
| Q7 | Quote the right side of `[ ]` comparisons and `case` words that should match literally | `[ $a = $b ]` | `[ "$a" = "$b" ]`; in `[[ $s == "$lit" ]]` quote `$lit` to stop glob matching |
| Q8 | Use single quotes for literal text containing `$`, backticks or `\` | `awk "{print \$1}"` | `awk '{print $1}'`; pass shell values with `awk -v v="$x"` |

2. Exceptions where leaving unquoted is correct, record each with a `# shellcheck disable=SC2086 # reason` comment on the line above:
   - Intentional splitting of a known-safe, space-separated list you control (prefer an array instead).
   - Inside `$(( ))` arithmetic.
3. Do NOT wrap the entire script in `IFS=` changes or `set -f` to hide warnings; fix each site.

### Output
Edited script and `quoting_fixes`.

### Quality Gate
- The Phase 1 shellcheck command now prints no findings, or only lines with a reasoned disable directive.
- The script parses after the last edit.

---

## Phase 3: Prove With Hostile Inputs

### Entry Criteria
- Edits complete.

### Actions
1. Create a test directory: `t=$(mktemp -d); touch "$t/a b" "$t/*" "$t/-rf" "$t/new
line"` (the last name contains a newline).
2. Run the script against `$t` (or with each name as an argument) and check that each file is processed once, by exact name, and nothing outside `$t` is touched: `ls -la "$t"` before and after.
3. Pass an argument that starts with a dash, for example `-n`, and confirm it is treated as data.

### Output
Hostile-input run log appended to `quoting_fixes`.

### Quality Gate
- The run exits 0 and the before/after listing shows exactly the expected changes.
- No "No such file or directory" or "invalid option" messages appear on stderr.

---

## Worked Example

Illustrative only.

```
$ shellcheck -s bash -f gcc -i SC2086,SC2046 bin/cleanup
bin/cleanup:14:8: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/cleanup:19:10: warning: Quote this to prevent word splitting. [SC2046]
```
Line 14 `rm $f` becomes `rm -- "$f"`; line 19 `for f in $(ls $dir)` is an iteration bug and is handed to `shs-safe-filename-iteration`.

Hostile run:
```
$ t=$(mktemp -d); touch "$t/a b" "$t/-rf"
$ bin/cleanup "$t"; echo "rc=$?"
removed 2 files
rc=0
```

---

## Exit Criteria

DONE when the targeted shellcheck codes are clear or justified, and hostile names and dash-prefixed values are handled correctly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hundreds of SC2086 hits | **Adjust**: fix function by function, rerunning shellcheck after each function. |
| Phase 2 | Quoting a variable breaks behavior that relied on splitting | **Adjust**: convert the variable to an array (bash) or `set --` list (posix); do not remove the quotes. |
| Phase 3 | A hostile file outside `$t` was touched | **Stop**: the script has a path bug; restore from backup and fix before any further run. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
