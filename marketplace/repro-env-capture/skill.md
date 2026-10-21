# Environment Capture and Diff

**One-line description:** Records the exact versions, OS, architecture, locale, time zone, config files and environment variables on both the reporter's machine and the local machine with real commands per stack, then diffs them so every difference that could change behavior is known before reproduction starts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bug_brief` (object, required): Output of `repro-intake-checklist`, including `reported_environment` and `reported_version`.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `env_snapshot` (object): Local and reported environment side by side: OS, kernel, architecture, libc, runtime and compiler versions, dependency lock state, locale, time zone, relevant environment variables, config files with hashes, and the checked-out commit.
- `env_diff` (object[]): One row per field where local differs from reported: `field`, `local`, `reported`, `could_affect_bug` (yes, no, unknown) with the reason, and `action` (`match locally`, `replicate in container`, `ignore`).

---

## Phase 1: Capture Local Environment

### Entry Criteria
- `stack` is one of the six allowed values.
- `git -C <repo_path> status --porcelain` output is recorded (a dirty tree is allowed but must be noted).

### Actions
1. Record the commit: `git -C <repo_path> rev-parse HEAD` and `git -C <repo_path> describe --tags --always --dirty`.
2. Record OS facts:
   - Linux: `uname -a`, `cat /etc/os-release`, `ldd --version | head -1` (glibc version), `getconf GNU_LIBC_VERSION`.
   - macOS: `sw_vers`, `uname -m`.
   - Windows: `systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"`.
3. Record locale and time: `locale` (Linux/macOS), `echo $TZ`, `date +%Z%z`. On Windows: `Get-Culture`, `Get-TimeZone` in PowerShell.
4. Record the stack toolchain with exactly these commands:

| `stack` | Commands |
|---|---|
| python | `python -VV`; `python -c "import sys,platform;print(sys.executable, platform.platform())"`; `python -m pip freeze --all` (or `uv pip freeze`, `poetry show`); hash the lock file: `sha256sum poetry.lock` / `uv.lock` / `requirements*.txt` |
| node | `node --version`; `npm --version` (or `pnpm --version`, `yarn --version`); `npm ls --all --depth=0`; hash `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`; record `"engines"` from `package.json` |
| go | `go version`; `go env GOOS GOARCH CGO_ENABLED GOFLAGS GOTOOLCHAIN`; `go list -m all`; hash `go.sum` |
| java | `java -version 2>&1`; `mvn -v` or `./gradlew --version`; `mvn dependency:tree` or `./gradlew dependencies --configuration runtimeClasspath` |
| rust | `rustc -vV`; `cargo -V`; `rustup show active-toolchain`; hash `Cargo.lock`; read `rust-toolchain.toml` if present |
| cpp | `cc --version`, `c++ --version` (or `gcc -v`, `clang -v`, `cl` on MSVC); `cmake --version`; read `CMAKE_BUILD_TYPE` and `CMAKE_CXX_FLAGS` from `build/CMakeCache.txt`; `ldd <binary>` (Linux) or `otool -L <binary>` (macOS) for linked library versions |

5. Record environment variables the program reads. Find them: `git -C <repo_path> grep -nE "os\.environ|getenv|process\.env|os\.Getenv|System\.getenv|env::var"`. For each name found, record its local value or "unset". Redact values that look like secrets (keys, tokens, passwords) as `<redacted, set>`.
6. Record config files the program loads (from the same grep plus documented config paths) with `sha256sum <file>`.

### Output
Local half of `env_snapshot`.

### Quality Gate
- Every row of the stack table for `stack` has its command output pasted (or the literal error if the tool is absent).
- No secret value appears in `env_snapshot` (search it for the variable names found in action 5 and confirm values are redacted).

---

## Phase 2: Collect Reported Environment

### Entry Criteria
- Local snapshot complete.

### Actions
1. Fill the reported half from `bug_brief.reported_environment` field by field.
2. For every field the report does not give, write "not reported". Do not copy the local value into the reported column.
3. If the report includes a dependency list or lock file, store its hash and the versions of every package that appears in `bug_brief.error_signature` frames.

### Output
Complete `env_snapshot` with both columns.

### Quality Gate
- No field in the reported column equals the local value unless a `source_quotes` line in `bug_brief` supports it.

---

## Phase 3: Diff and Classify

### Entry Criteria
- Both columns filled.

### Actions
1. Produce `env_diff` rows for every field where columns differ or the reported column is "not reported".
2. Set `could_affect_bug` with these rules (first match wins):

| Condition | `could_affect_bug` |
|---|---|
| The differing package or runtime appears in a frame of `error_signature` | yes |
| `severity_class` is crash and field is OS, libc, architecture or compiler | yes |
| Bug involves text, sorting, dates or numbers and field is locale, `LANG`, `LC_ALL`, `TZ` | yes |
| Bug involves paths and field is OS (path separator, case sensitivity) | yes |
| Field is a config value read on the failing code path (from Phase 1 grep) | yes |
| Field is "not reported" | unknown |
| Otherwise | no |

3. Set `action`: `match locally` when the difference can be changed by an environment variable, a dependency pin, or a toolchain switch (`pyenv`, `nvm use`, `go install golang.org/dl/goX.Y.Z@latest`, `rustup toolchain install`, `sdk use java`); `replicate in container` when OS, libc or architecture differ and `could_affect_bug` is yes; `ignore` when `could_affect_bug` is no.
4. Every `unknown` row also goes back as a question for `missing_info` (append it to the brief's missing list in your report).

### Output
`env_snapshot`, `env_diff`.

### Quality Gate
- Every `env_diff` row has one of the three `action` values.
- Each `yes` row names the rule from the table that matched.

---

## Worked Example

Illustrative only. `stack` = node. Report: "Ubuntu 22.04, Node 20, dates show one day early."

- Phase 1: local `node --version` prints `v22.11.0`; `date +%Z%z` prints `UTC+0000`; grep finds `process.env.TZ` unused and `Intl.DateTimeFormat` in `src/format/date.ts`.
- Phase 2: reported Node "20" (minor not reported), TZ "not reported", locale "not reported".
- Phase 3: `env_diff` rows: `node` v22.11.0 vs 20.x, yes (runtime ICU data differs by version), action `match locally` via `nvm install 20 && nvm use 20`; `TZ` UTC vs not reported, yes (dates one day off is the classic local-midnight versus UTC symptom), action `match locally` by trying `TZ=America/Los_Angeles`; a question added asking the reporter for `date +%Z%z` output.

---

## Exit Criteria

DONE when `env_snapshot` holds both columns and every difference in `env_diff` carries a classification and an action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A toolchain command is not installed | **Adjust**: record the error text and install the version the repo pins (`.python-version`, `.nvmrc`, `go.mod` `go`/`toolchain` line, `rust-toolchain.toml`) before continuing. |
| Phase 1 | Secret value would be written to the snapshot | **Stop**: redact it; never paste credentials into a bug artifact. |
| Phase 2 | Reporter environment is entirely "not reported" | **Return**: send the env questions back through `missing_info`; continue with local only and mark every row unknown. |
| Phase 3 | Weak model marks everything `ignore` to move faster | **Retry**: re-apply the table row by row; a skipped OS or locale difference is the most common reason a bug "does not reproduce". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
