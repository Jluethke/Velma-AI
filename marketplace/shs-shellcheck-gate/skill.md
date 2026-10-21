# ShellCheck Gate

**One-line description:** Runs ShellCheck at a pinned version with a committed `.shellcheckrc` (`shell=`, `external-sources=true`, `source-path=SCRIPTDIR`), fixes findings code by code (SC2086, SC2155, SC2164, SC2181, SC1091 and others) instead of blanket disables, requires a reason on every inline `# shellcheck disable=`, and ends with exit code 0 at the chosen severity.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script (or directory of scripts) to check.
- `shell_dialect` (string, required): `bash` or `posix` (`posix` maps to ShellCheck's `sh`).

---

## Outputs

- `shellcheck_report` (object): ShellCheck version, `.shellcheckrc` contents, findings by code before and after, every remaining disable with its reason, final exit code.

---

## Phase 1: Configure and Baseline

### Entry Criteria
- `shellcheck --version` runs. If not installed: `apt-get install shellcheck`, `brew install shellcheck`, `scoop install shellcheck`, or the container `koalaman/shellcheck:stable`.

### Actions
1. Record `shellcheck --version`. Distribution packages can lag the upstream release; codes and optional checks differ by version, so CI must use the same version (`shs-ci-shell-matrix`).
2. Create `.shellcheckrc` in the repository root (or extend it; never delete existing lines):

```
shell=bash
external-sources=true
source-path=SCRIPTDIR
```

   Use `shell=sh` for posix. `external-sources=true` lets `-x`-style following of `source` files work from the rc file (ShellCheck 0.8.0 and later). `source-path=SCRIPTDIR` resolves `source ./lib.sh` relative to the script.
3. Baseline: `shellcheck -f gcc "$script_path" > sc-before.txt; echo "rc=$?"`. Exit 0 means no findings, 1 means findings.
4. Count by code: `grep -oE 'SC[0-9]+' sc-before.txt | sort | uniq -c | sort -rn`.

### Output
Baseline counts.

### Quality Gate
- `.shellcheckrc` exists with the three keys.
- The count table is saved in `shellcheck_report`.

---

## Phase 2: Fix by Code

### Entry Criteria
- Baseline exists.

### Actions
1. Work through codes from most to least frequent. Fix all sites of one code, rerun `shellcheck`, then the next code. Common codes and their fix:

| Code | Meaning | Fix |
|---|---|---|
| SC2086 | Unquoted variable | Quote it (`shs-quoting-audit`) |
| SC2046 | Unquoted `$( )` | Quote it, or read into an array |
| SC2155 | `local x=$(cmd)` masks return value | Declare and assign on separate lines |
| SC2164 | `cd dir` without failure handling | `cd -- "$dir" \|\| exit` (or rely on `set -e` and still add it; ShellCheck cannot see errexit inside functions used in conditions) |
| SC2181 | `if [ $? -ne 0 ]` after a command | `if ! cmd; then` |
| SC2034 | Variable assigned but unused | Remove it, or `export` it if another program reads it |
| SC2154 | Variable used but never assigned | Assign a default `${var:-}` or source the file that sets it |
| SC1090/SC1091 | Cannot follow `source` | Add `# shellcheck source=lib/common.sh` above the line, or fix `source-path` |
| SC2128 | Array used as scalar | Use `"${arr[@]}"` or `"${arr[0]}"` |
| SC2206/SC2207 | Array from unquoted expansion | `read -ra arr <<< "$s"` or `mapfile -t arr < <(cmd)` (bash 4.0) |
| SC2044/SC2045 | Loop over `find`/`ls` output | `shs-safe-filename-iteration` |
| SC2162 | `read` without `-r` | `IFS= read -r` |
| SC2016 | `$` inside single quotes | Correct when intentional (for example passing to `awk`); disable with reason |
| SC3xxx | Not POSIX (in `sh` mode) | `shs-posix-bashism-removal` |

2. For a code not in the table, open `https://www.shellcheck.net/wiki/SCxxxx` and apply the documented fix.
3. A disable is allowed only when the code is a false positive for that line. Write it on the line directly above, with a reason: `# shellcheck disable=SC2016 # literal $1 is for awk`. Never put a file-wide `disable` in `.shellcheckrc` for SC2086 or SC2046.
4. Do NOT edit more than one code's worth of sites between ShellCheck runs.

### Output
Edited script.

### Quality Gate
- `shellcheck -f gcc "$script_path"` count drops after every code.
- Every `# shellcheck disable=` line has a `#` reason after it: `grep -n 'shellcheck disable=' "$script_path" | grep -vc '# .*# '` prints `0`.

---

## Phase 3: Tighten and Lock In

### Entry Criteria
- Default checks pass with exit 0.

### Actions
1. List optional checks: `shellcheck --list-optional`. Consider enabling `require-variable-braces`, `quote-safe-variables`, `check-unassigned-uppercase` and `avoid-nullary-conditions` with `enable=` lines in `.shellcheckrc` only if the user wants stricter style. Record the choice.
2. Final run at the gate severity: `shellcheck -S style "$script_path"; echo "rc=$?"`. Use `-S warning` only if the user chose to accept info and style findings; record that choice.
3. Save `sc-after.txt` and the final exit code.
4. Delete `sc-before.txt` and `sc-after.txt` from the repository after copying their counts into `shellcheck_report`; they are scratch.

### Output
`shellcheck_report`.

### Quality Gate
- Final `shellcheck -S <chosen severity>` exits 0.
- `shellcheck_report` lists every remaining disable with line and reason.

---

## Worked Example

Illustrative only.

```
$ shellcheck --version | sed -n 2p
version: 0.10.0
$ shellcheck -f gcc bin/rotate | grep -oE 'SC[0-9]+' | sort | uniq -c | sort -rn
      7 SC2086
      2 SC2155
      1 SC2164
      1 SC1091
```
After fixing SC2086 (7 quotes), SC2155 (split 2 declarations), SC2164 (`cd -- "$d" || exit`), SC1091 (`# shellcheck source=lib/log.sh`):
```
$ shellcheck -S style bin/rotate; echo "rc=$?"
rc=0
```

---

## Exit Criteria

DONE when ShellCheck at the recorded version and severity exits 0, the rc file is committed-ready, and every disable is justified inline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Local version differs from CI version | **Adjust**: run the CI version via `docker run --rm -v "$PWD":/mnt koalaman/shellcheck:<tag> /mnt/<script>`. |
| Phase 2 | Fixing a code changes behavior (quoting broke intended splitting) | **Adjust**: convert to an array; never disable SC2086 to keep a splitting bug. |
| Phase 2 | Tempted to disable a code file-wide to finish | **Stop**: that is weakening the gate; fix each site or justify each line. |
| Phase 3 | Optional check floods output | **Adjust**: leave it disabled and record the decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
