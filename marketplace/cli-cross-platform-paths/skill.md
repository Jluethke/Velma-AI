# CLI Cross-Platform Paths and Files

**One-line description:** Finds and fixes the path, glob, encoding and newline bugs that break a CLI on Windows or macOS (string-joined paths, `path` vs `path/filepath`, `\\?\` canonical paths, unexpanded `*.log` on Windows shells, locale-dependent text encoding, CRLF), then runs the e2e suite on a Linux, macOS and Windows CI matrix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `precedence_table` (object, required): Config paths per OS from `cli-config-env-precedence`.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `path_findings` (object[]): Each defect found by the scans and the fix.
- `platform_matrix` (object): The CI matrix file path, the OS list, and the result per OS.

---

## Phase 1: Scan for Known Defects

### Entry Criteria
- Source tree available in `project_dir`.

### Actions
1. Run the scans for the stack and read every hit:

| Stack | Defect | Scan |
|---|---|---|
| python | string-joined paths | `grep -rnE "\+ *['\"][/\\\\]" src/` |
| python | `open()` without encoding (uses the locale code page on Windows) | `grep -rn "open(" src/ | grep -v "encoding="` (binary-mode opens are fine) |
| python | home dir by env var | `grep -rn "environ\[.HOME.\]" src/` (use `Path.home()`) |
| node | string-joined paths | `grep -rnE "\+ *['\"]/" src/` |
| node | `new URL(import.meta.url).pathname` (gives `/C:/...` on Windows) | `grep -rn "\.pathname" src/` (use `fileURLToPath`) |
| go | `path` package used for file paths (it is for slash-separated URL paths) | `grep -rn '"path"' --include=*.go .` |
| go | hand-built separators | `grep -rn '"/" *+\|+ *"/"' --include=*.go .` |
| rust | `canonicalize` output shown to users or compared (returns `\\?\C:\...` on Windows) | `grep -rn "canonicalize" src/` |
| rust | `to_str().unwrap()` on paths (panics on non-UTF-8) | `grep -rn "to_str().unwrap()" src/` |
| all | operands treated as globs on Windows | read the operand handling: does the code expand `*`? |

2. Record each real defect in `path_findings`.

### Output
Defect list.

### Quality Gate
- Every scan in the table for this stack was run and its hit count recorded.

---

## Phase 2: Fix

### Entry Criteria
- Defect list exists.

### Actions
1. Apply the replacement for each defect, one file at a time, running the unit tests after each file:

| Stack | Replace with |
|---|---|
| python | `pathlib.Path` and the `/` operator; `open(p, encoding="utf-8")`; `newline=""` for the `csv` module; `Path.home()` |
| node | `path.join`, `path.resolve`, `os.homedir()`, `fileURLToPath(import.meta.url)` |
| go | `path/filepath` (`filepath.Join`, `filepath.Rel`, `filepath.ToSlash` when printing for stable output), `os.UserHomeDir()` |
| rust | `PathBuf::join`, `path.display()` for printing, `dunce::canonicalize` when a canonical path is shown or compared |

2. Globs. POSIX shells expand `*.log` before the tool sees it; `cmd.exe` and PowerShell pass `*.log` literally. Decide:

| `cli_spec` says operands may be globs | Action |
|---|---|
| yes | on Windows, expand operands that contain `*`, `?` or `[` yourself: Python `glob.glob`, Node `fs.globSync` (check your Node version's docs) or the `fast-glob` package, Go `filepath.Glob`, Rust the `wild` crate (`wild::args_os()` passed to clap's `parse_from`) |
| no | leave operands as literal names, and say so in help |

3. Line endings: write `\n` on all platforms unless `cli_spec` says otherwise; when reading, accept both `\n` and `\r\n` (strip a trailing `\r`).
4. Python console encoding: on Windows, set `PYTHONUTF8=1` in tests, and in code call `sys.stdout.reconfigure(errors="replace")` only if `cli_spec` allows lossy output.
5. Do not compare paths as strings for equality on Windows or macOS default filesystems (case-insensitive). Compare with `os.path.samefile` / `Path.samefile`, `os.SameFile`, or the stack equivalent when both exist.
6. Reserved Windows names (`CON`, `PRN`, `AUX`, `NUL`, `COM1`..`COM9`, `LPT1`..`LPT9`) cannot be created as files; if the tool creates files from user data, reject those names with a clear error.

### Output
Fixes applied.

### Quality Gate
- Rerunning every Phase 1 scan shows no remaining real defect (remaining hits are annotated as false positives in `path_findings`).

---

## Phase 3: Run on Three Operating Systems

### Entry Criteria
- Fixes applied; an e2e suite exists or the stack's unit tests exercise the paths.

### Actions
1. Create `.github/workflows/cross-platform.yml` (or the user's CI equivalent):
```yaml
name: cross-platform
on: [push, pull_request]
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      # add the stack setup action here: actions/setup-python, actions/setup-node, actions/setup-go, or dtolnay/rust-toolchain
      - run: <stack test command>
        shell: bash
```
2. `shell: bash` on `windows-latest` uses Git Bash, so POSIX test commands work; add one step with `shell: pwsh` that runs `<tool> *.log` in a directory with two `.log` files to prove glob handling on a Windows shell.
3. Add a test that writes and reads a file whose name contains a space and a non-ASCII character (for example `résumé log.txt`).
4. Push and read the result for each OS. Record it in `platform_matrix`.

### Output
`path_findings`, `platform_matrix`.

### Quality Gate
- All three matrix jobs report success in the CI run page.
- The `pwsh` glob step prints results for both `.log` files.

---

## Do Not

- Do not hardcode `/` or `\\` as a separator anywhere in path construction.
- Do not skip Windows tests to get a green matrix; mark a test Windows-skipped only when the feature is POSIX-only by design (signals), and record why.
- Do not use `fail-fast: true`; one OS failure would hide the others.

---

## Worked Example

Illustrative. Node `logtrim`, Windows job failing:
```
Error: ENOENT: no such file or directory, open 'C:\C:\Users\runner\work\logtrim\defaults.json'
```
Scan hit: `new URL('../defaults.json', import.meta.url).pathname`. Fix: `fileURLToPath(new URL('../defaults.json', import.meta.url))`. Second finding from the `pwsh` step:
```
logtrim: *.log: no such file
```
Fix: expand operands with `fast-glob` when `process.platform === 'win32'`. Rerun: ubuntu, macos, windows all green.

---

## Exit Criteria

DONE when every scan is clean or annotated, glob and encoding decisions are implemented, and the suite passes on Linux, macOS and Windows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Scan returns hundreds of hits | **Adjust**: narrow to files that handle paths (grep for `open`, `read`, `write`, `join` first). |
| Phase 2 | A fix breaks a unit test | **Retry**: revert that file, fix narrower, rerun. |
| Phase 3 | No CI available | **Return**: report that the matrix could not run; list the OSes tested locally. |
| Phase 3 | Windows-only failure in temp cleanup (file in use) | **Adjust**: close file handles before deleting; Windows cannot delete open files. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
