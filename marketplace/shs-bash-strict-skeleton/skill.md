# Bash Strict-Mode Script Skeleton

**One-line description:** Writes a new bash script file from a fixed skeleton: `#!/usr/bin/env bash`, `set -Eeuo pipefail`, a version guard against `bash_min_version`, `readonly` script directory, a `main "$@"` entry point guarded so the file can be sourced by tests, and `bash -n` plus a first run proving it parses and exits 0.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Path of the script file to create or rebuild, for example `bin/archive-logs`.
- `script_requirements` (object, required): Output of `shs-script-requirements-intake`.
- `bash_min_version` (string, required): From `shs-bash-vs-posix-decision`, for example `4.4`.

---

## Outputs

- `skeleton_report` (object): `script_path`, the `bash -n` result, the first-run exit code, and the list of placeholder functions created.

---

## Phase 1: Write the Skeleton

### Entry Criteria
- `script_path` does not exist, or the user confirmed it may be rebuilt (keep a copy as `<script_path>.orig` first).

### Actions
1. Write exactly this structure to `script_path` (one file only; do not create helper libraries yet):

```bash
#!/usr/bin/env bash
# <one line: what this script does>
set -Eeuo pipefail
shopt -s inherit_errexit 2>/dev/null || true   # bash >= 4.4; harmless no-op below

readonly SCRIPT_NAME="${0##*/}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_DIR

require_bash() {
  local need_major=$1 need_minor=$2
  if (( BASH_VERSINFO[0] < need_major ||
        (BASH_VERSINFO[0] == need_major && BASH_VERSINFO[1] < need_minor) )); then
    printf '%s: needs bash >= %s.%s, running %s\n' \
      "$SCRIPT_NAME" "$need_major" "$need_minor" "$BASH_VERSION" >&2
    exit 1
  fi
}

main() {
  require_bash MAJOR MINOR
  # parse_args "$@"   (added by shs-getopts-arg-parsing)
  # do_work           (one function per step in script_requirements)
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
```

2. Replace `MAJOR MINOR` with the two numbers of `bash_min_version` (for `4.4`: `require_bash 4 4`).
3. Add one empty function per step implied by `script_requirements.side_effects`, each named with a verb (`collect_files`, `write_archive`), and call them from `main` in order.
4. If `script_requirements.invoker` is cron, add `export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` as the first line after `set`.
5. Make it executable: `chmod +x "$script_path"`.

### Output
Script file on disk.

### Quality Gate
- `head -n 1 "$script_path"` prints `#!/usr/bin/env bash`.
- `grep -c 'set -Eeuo pipefail' "$script_path"` prints `1`.

---

## Phase 2: Prove It Parses and Runs

### Entry Criteria
- Skeleton written.

### Actions
1. Run `bash -n "$script_path"; echo "rc=$?"`. Expect `rc=0` and no other output.
2. Run `"$script_path"; echo "rc=$?"`. Expect `rc=0` (empty functions succeed).
3. Prove the version guard fires: `BASH_VERSINFO` is readonly, so instead run the script with an older bash if one exists (`/bin/bash` on macOS is 3.2) and expect the "needs bash" message and `rc=1`. If no older bash exists, record "guard not exercised" in `skeleton_report`.
4. Prove the source guard: `bash -c 'source "$1"; declare -F main' _ "$script_path"` prints `declare -f main` and does not run `main`.
5. Record results in `skeleton_report`.

### Output
`skeleton_report`.

### Quality Gate
- `bash -n` exit code is 0.
- First run exit code is 0.
- Sourcing the file defines `main` without running it.

---

## Worked Example

Illustrative only.

Input: `script_path` = `bin/archive-logs`, `bash_min_version` = `4.4`, side effects "select old logs", "write tar.gz", "delete originals".

Phase 1 adds `require_bash 4 4` and functions `select_old_logs`, `write_archive`, `delete_originals`.

Phase 2:
```
$ bash -n bin/archive-logs; echo "rc=$?"
rc=0
$ bin/archive-logs; echo "rc=$?"
rc=0
$ /bin/bash bin/archive-logs; echo "rc=$?"      # macOS bash 3.2
archive-logs: needs bash >= 4.4, running 3.2.57(1)-release
rc=1
$ bash -c 'source "$1"; declare -F main' _ bin/archive-logs
declare -f main
```

---

## Exit Criteria

DONE when the skeleton exists, is executable, parses, runs with exit 0, and is sourceable without side effects.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `script_path` exists and user did not approve rebuild | **Stop**: harden the existing file with the later flows instead of overwriting it. |
| Phase 2 | `bash -n` reports a syntax error | **Adjust**: fix the reported line only, rerun `bash -n`. |
| Phase 2 | `$'\r': command not found` on run | **Adjust**: the file has CRLF endings; run `shs-line-endings-exec-bit` first. |
| Phase 2 | Skeleton exits nonzero | **Retry**: run `bash -x "$script_path"` and read the last `+` line before the exit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
