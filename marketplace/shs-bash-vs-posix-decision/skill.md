# Bash or POSIX sh Decision

**One-line description:** Confirms or rejects the requested shell `stack` (bash or POSIX sh) against the probed platforms, and pins the minimum bash version from the specific features the script needs (associative arrays 4.0, `wait -n` 4.3, `inherit_errexit` 4.4), so the shebang matches what every target host can actually run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_requirements` (object, required): Output of `shs-script-requirements-intake`, with probed `platforms[]`.
- `stack` (string, required): Requested dialect: `bash` or `posix`.

---

## Outputs

- `shell_dialect` (string): Confirmed `bash` or `posix`.
- `bash_min_version` (string): Lowest bash version required, for example `3.2`, `4.0`, `4.4`. `none` when `shell_dialect` is `posix`.

---

## Phase 1: Check Availability

### Entry Criteria
- `stack` is `bash` or `posix`.

### Actions
1. Apply this table to every platform in `script_requirements.platforms`:

| Platform fact | If `stack` = bash | If `stack` = posix |
|---|---|---|
| bash present (any version) | OK | OK |
| bash absent, cannot be installed (busybox image, initramfs, router firmware) | **Reject**: switch to posix | OK |
| bash absent, can be installed (`apk add bash`) | OK only if the image build is in scope; record the install step | OK |
| Script runs as `/bin/sh` via a caller you do not control (Debian maintainer script, `sh -c`, Makefile recipe) | **Reject**: the caller uses `/bin/sh`, which is dash on Debian and Ubuntu | OK |

2. If any row rejects bash, set `shell_dialect` = `posix` and record the platform that forced it.
3. If `stack` = posix and the requirements need arrays of filenames with spaces, note that POSIX sh has only `"$@"` as an array; one list at a time.

### Output
Draft `shell_dialect`.

### Quality Gate
- Each platform has a row result written next to its name.
- A rejection names the platform and the probe output that caused it.

---

## Phase 2: Pin the Minimum bash Version

### Entry Criteria
- Draft `shell_dialect` = `bash`. If `posix`, set `bash_min_version` = `none` and skip to Exit.

### Actions
1. List each bash feature the script will use and take the highest version from this table (bash NEWS file and manual):

| Feature | First bash version |
|---|---|
| Indexed arrays, `[[ ]]`, `$( )`, `${var//a/b}`, `local` | 3.2 or earlier |
| `declare -A` associative arrays, `mapfile`/`readarray`, `${var,,}` `${var^^}`, `;&` and `;;&` in case, `globstar`, `\|&` | 4.0 |
| `declare -n` namerefs, `wait -n` | 4.3 |
| `shopt -s inherit_errexit`, `${var@Q}`, empty `"${arr[@]}"` safe under `set -u` | 4.4 |
| `$EPOCHSECONDS`, `$EPOCHREALTIME` | 5.0 |
| `wait -p VAR` | 5.1 |

2. Compare to the lowest probed `bash_version`. If macOS is a target, the system `/bin/bash` is 3.2; any feature above 3.2 requires either Homebrew bash with `#!/usr/bin/env bash` and a documented install step, or rewriting without the feature.
3. Set `bash_min_version` to the highest feature version needed.

### Output
`shell_dialect`, `bash_min_version`.

### Quality Gate
- Every listed feature has its version from the table.
- `bash_min_version` is less than or equal to every probed `bash_version`, or the gap is recorded with an install step.

---

## Worked Example

Illustrative only.

Input: `stack` = bash; platforms Ubuntu 22.04 (bash 5.1.16), macOS 14 (`/bin/bash` 3.2.57), no busybox targets.

Phase 1: both have bash; no `/bin/sh` caller. Draft `shell_dialect` = bash.

Phase 2: features planned: `mapfile` (4.0), `inherit_errexit` (4.4). macOS 3.2 fails. Options recorded: (a) `brew install bash` and `#!/usr/bin/env bash`, or (b) replace `mapfile` with a `while IFS= read -r` loop and drop `inherit_errexit`. User picks (b). `bash_min_version` = `3.2`.

```
$ /bin/bash -c 'mapfile -t a < /dev/null'
/bin/bash: mapfile: command not found
```

---

## Exit Criteria

DONE when `shell_dialect` is confirmed per platform and `bash_min_version` is pinned from the feature table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` is `pwsh` or another value | **Stop**: this flow covers bash and POSIX sh only; PowerShell uses the `shs-pwsh-` flows. |
| Phase 1 | Platform bash version unknown | **Return**: ask for `bash --version` output from that host. |
| Phase 2 | Feature not in the table | **Adjust**: look it up in the bash NEWS file (`https://git.savannah.gnu.org/cgit/bash.git/tree/NEWS`) and cite it; never guess a version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
