# POSIX sh Script Skeleton

**One-line description:** Writes a new `#!/bin/sh` script that runs unchanged under dash, busybox ash and bash-as-sh: `set -eu`, a probed `pipefail` enable, `printf` instead of `echo`, a `main "$@"` entry point, and a parse-and-run check under every available `/bin/sh` implementation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Path of the script file to create.
- `script_requirements` (object, required): Output of `shs-script-requirements-intake`.

---

## Outputs

- `skeleton_report` (object): `script_path`, per-shell `-n` results and run exit codes (dash, busybox sh, `bash --posix`), and whether `pipefail` was available on each.

---

## Phase 1: Write the Skeleton

### Entry Criteria
- `script_path` does not exist, or the user approved a rebuild (copy to `<script_path>.orig` first).

### Actions
1. Write exactly this structure:

```sh
#!/bin/sh
# <one line: what this script does>
set -eu
# pipefail is in POSIX.1-2024 and in bash, busybox ash and recent dash.
# Older dash rejects it, so enable it only when the shell accepts it.
if (set -o pipefail) 2>/dev/null; then set -o pipefail; fi

SCRIPT_NAME=${0##*/}

err() { printf '%s: %s\n' "$SCRIPT_NAME" "$*" >&2; }
die() { err "$*"; exit 1; }

main() {
  : # parse_args "$@"; then one function per step
}

main "$@"
```

2. Do NOT use any of: `[[ ]]`, arrays, `function` keyword, `source`, `==` inside `[ ]`, `echo -n` or `echo -e`, `$'...'`, `{a,b}` brace expansion, `<<<`, `<( )`, `$RANDOM`, `${var:0:3}` substrings, `${var//a/b}`. Each is a bashism; `shs-posix-bashism-removal` lists the replacements.
3. `local` is not in POSIX but dash, busybox ash and bash all support it. Use it only if every probed `/bin/sh` is one of those three; otherwise prefix function variables with the function name (`collect_count=0`).
4. Because POSIX sh has no `BASH_SOURCE`, a test harness sources the logic by setting an env var: change the last line to `[ "${SHS_SOURCED:-0}" = 1 ] || main "$@"`.
5. `chmod +x "$script_path"`.

### Output
Script file on disk.

### Quality Gate
- `head -n 1 "$script_path"` prints `#!/bin/sh`.
- `shellcheck -s sh "$script_path"` reports no SC3xxx (sh-compatibility) codes. If shellcheck is not installed, record that and run the gate in `shs-shellcheck-gate`.

---

## Phase 2: Parse and Run Under Every sh

### Entry Criteria
- Skeleton written.

### Actions
1. Run each available shell, recording exit codes:
   - `dash -n "$script_path" && dash "$script_path"; echo "dash rc=$?"`
   - `busybox sh -n "$script_path" && busybox sh "$script_path"; echo "busybox rc=$?"` (or `docker run --rm -v "$PWD":/w -w /w alpine:3 sh "$script_path"`)
   - `bash --posix "$script_path"; echo "bash-posix rc=$?"`
2. Record whether `pipefail` was enabled on each: `dash -c 'set -o pipefail && echo yes'`. A "set: Illegal option -o pipefail" message means that dash predates it.
3. Any shell not available: record "not tested" and add it to `open_questions`; do not claim it passes.

### Output
`skeleton_report`.

### Quality Gate
- Every tested shell shows `rc=0`.
- Each target `/bin/sh` from `script_requirements.platforms` was tested or is listed as not tested.

---

## Worked Example

Illustrative only.

Input: `script_path` = `install.sh` for Debian 12 hosts and an Alpine 3.20 image.

```
$ dash -n install.sh && dash install.sh; echo "dash rc=$?"
dash rc=0
$ docker run --rm -v "$PWD":/w -w /w alpine:3.20 sh install.sh; echo "busybox rc=$?"
busybox rc=0
$ bash --posix install.sh; echo "bash-posix rc=$?"
bash-posix rc=0
$ dash -c 'set -o pipefail && echo yes'
yes
```
`skeleton_report.pipefail` = {dash: yes, busybox: yes, bash: yes}.

---

## Exit Criteria

DONE when the skeleton parses and runs with exit 0 under every reachable target `/bin/sh`, and `pipefail` support is recorded per shell.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirements need arrays of arbitrary filenames | **Return**: send back to `shs-bash-vs-posix-decision`; POSIX sh has only `"$@"` as a list. |
| Phase 2 | `dash: Syntax error` | **Adjust**: a bashism slipped in; fix that line with the `shs-posix-bashism-removal` table. |
| Phase 2 | dash rejects `pipefail` | **Adjust**: keep the probe guard; never write pipelines whose left side can fail silently. Split them into two steps through a temp file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
