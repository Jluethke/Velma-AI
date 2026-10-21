# POSIX sh Bashism Removal

**One-line description:** Makes a `#!/bin/sh` script truly POSIX by finding every bashism with `checkbashisms` and `shellcheck -s sh` (SC3xxx codes), replacing each with its POSIX form from a fixed table, and proving the result under dash and busybox sh.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script whose shebang is, or will become, `#!/bin/sh`.

---

## Outputs

- `bashism_fixes` (object[]): Per finding: line, tool and code (for example `SC3010` or checkbashisms message), before, after.

---

## Phase 1: Detect Bashisms

### Entry Criteria
- `head -n 1 "$script_path"` is `#!/bin/sh` (change it first if the decision was posix).

### Actions
1. Run `shellcheck -s sh -f gcc "$script_path"` and keep lines whose code starts with `SC3` (the "In POSIX sh, X is undefined" family).
2. If `checkbashisms` is installed (Debian/Ubuntu package `devscripts`), run `checkbashisms "$script_path"`. Its exit status is nonzero when it finds something.
3. Run `dash -n "$script_path"` to catch syntax-level bashisms (for example `[[`, `function f {`, arrays) that stop parsing.
4. Merge all three lists by line number into one findings list.

### Output
Findings list.

### Quality Gate
- The raw output of each tool run is saved, including "not installed" if a tool is missing.
- Every finding has a line number.

---

## Phase 2: Replace Each Bashism

### Entry Criteria
- Findings list exists.

### Actions
1. Fix one finding, run `dash -n "$script_path"`, then move to the next. Never edit several lines blind.
2. Replacement table:

| Bashism | POSIX replacement |
|---|---|
| `[[ $a == $b ]]` | `[ "$a" = "$b" ]` |
| `[[ $s == foo* ]]` (pattern) | `case $s in foo*) ... ;; esac` |
| `[[ $s =~ re ]]` | `printf '%s\n' "$s" \| grep -Eq 're'` or a `case` glob |
| `[ a == b ]` | `[ a = b ]` |
| `function f { }` | `f() { }` |
| `source file` | `. ./file` (dot needs a path with a slash or it searches `PATH`) |
| `echo -n x`, `echo -e 'a\tb'` | `printf '%s' x`, `printf 'a\tb\n'` |
| `arr=(a b); "${arr[@]}"` | `set -- a b; "$@"` (one list only; save the original args first if needed) |
| `$'\n'` | a literal newline inside quotes, or `nl=$(printf '\n_'); nl=${nl%_}` |
| `{1..5}` | `i=1; while [ "$i" -le 5 ]; do ...; i=$((i + 1)); done` |
| `cmd <<< "$s"` | `printf '%s\n' "$s" \| cmd` |
| `diff <(a) <(b)` | write `a` and `b` to `mktemp` files, then `diff "$t1" "$t2"` |
| `${s:0:3}` | `printf '%s' "$s" \| cut -c1-3` |
| `${s//a/b}` | `printf '%s' "$s" \| sed 's/a/b/g'` |
| `$RANDOM` | `awk 'BEGIN{srand(); print int(rand()*32768)}'` (not for security) |
| `&>file` | `>file 2>&1` |
| `read -p "x" v` | `printf 'x' >&2; read -r v` |
| `let i++`, `((i++))` | `i=$((i + 1))` |
| `$(< file)` | `$(cat file)` |

3. For a finding not in the table, look up the POSIX Shell Command Language spec (`https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html`) and cite the section; do not guess.

### Output
Edited script and `bashism_fixes`.

### Quality Gate
- `shellcheck -s sh "$script_path" | grep -c 'SC3'` prints `0`.
- `dash -n "$script_path"` exits 0.

---

## Phase 3: Prove Under Real POSIX Shells

### Entry Criteria
- Zero SC3 findings.

### Actions
1. Run the script's normal path with `dash "$script_path"` and with busybox (`busybox sh "$script_path"` or `docker run --rm -v "$PWD":/w -w /w alpine:3 sh /w/<script>`).
2. Compare stdout of both runs with the pre-change output: `diff <(old run) <(new run)` from an interactive bash, or save both to files and `diff` them.

### Output
Run evidence appended to `bashism_fixes`.

### Quality Gate
- Both runs exit 0.
- `diff` of old and new stdout is empty, or each difference is explained.

---

## Worked Example

Illustrative only.

```
$ shellcheck -s sh -f gcc deploy.sh
deploy.sh:12:4: warning: In POSIX sh, [[ ]] is undefined. [SC3010]
$ checkbashisms deploy.sh
possible bashism in deploy.sh line 27 (echo -n):
echo -n "Deploying..."
```
Fixes: line 12 `[[ $env == prod ]]` becomes `[ "$env" = prod ]`; line 27 becomes `printf '%s' "Deploying..."`.

```
$ shellcheck -s sh deploy.sh | grep -c SC3
0
$ dash deploy.sh --dry-run; echo "rc=$?"
rc=0
```

---

## Exit Criteria

DONE when no SC3 findings remain, `dash -n` passes, and the script runs under dash and busybox with unchanged output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | shellcheck not installed | **Adjust**: run it in a container: `docker run --rm -v "$PWD":/mnt koalaman/shellcheck:stable -s sh /mnt/<script>`. |
| Phase 2 | Script genuinely needs two independent arrays | **Return**: send back to `shs-bash-vs-posix-decision` to reconsider bash. |
| Phase 3 | Output differs between dash and busybox | **Adjust**: usually an `echo` with backslashes or a `sed`/`awk` extension; switch to `printf` and POSIX flags. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
