# Deterministic Reproduction Script

**One-line description:** Writes a single self-contained script that drives the program from a clean state to the reported failure and exits non-zero exactly when the bug's error signature appears, then measures how often it fails across repeated runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bug_brief` (object, required): Output of `repro-intake-checklist`.
- `env_snapshot` (object, required): Output of `repro-env-capture`.
- `replica_recipe` (object, required): Output of `repro-container-env-replica`; tells you whether to run locally with switches or inside the replica image.
- `repo_path` (string, required): Absolute path to the local clone.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `confirm_runs` (integer, required): How many times to run the script to measure the failure rate. A user input; this flow does not choose it.

---

## Outputs

- `repro_script` (object): Path of the script (kept outside version control, for example `.repro/repro.sh`), its full text, the exact command to run it, and the oracle it uses to decide "bug present".
- `repro_rate` (object): `runs`, `failures_with_signature`, `failures_other`, `passes`, and the literal signature line from one failing run.

---

## Phase 1: Define the Oracle

### Entry Criteria
- `bug_brief` is not marked BLOCKED.
- `confirm_runs` is a positive integer.

### Actions
1. Write the oracle: the exact check that says the bug happened. Pick by `severity_class`:

| `severity_class` | Oracle |
|---|---|
| crash | Process output contains the exception type and message from `error_signature` (use `grep -F` for a fixed string, not a regex) |
| wrong-result | Program output for the failing input is compared with the literal expected value; mismatch means bug present |
| hang | The command is still running after a timeout passed to `timeout <seconds>` (GNU coreutils; exit code 124 means it timed out). Use the reporter's wait time as the timeout; if none was reported, ask for one rather than choosing it |
| data-loss | A before and after checksum or row count of the affected data differs from the expected value |
| performance | Do not use this flow; performance bugs need a benchmark harness, not a pass/fail oracle |

2. The script must exit with code 1 when the oracle says bug present, 0 when the program behaves as expected, and 2 for any other failure (build error, a different exception, missing file). The three-way exit is required later by `git bisect run`, which treats 125 as skip; you will map 2 to 125 there.

### Output
Written oracle definition.

### Quality Gate
- The oracle string is copied from `bug_brief.error_signature` or `bug_brief.expected`, not invented.
- The exit code contract (0 / 1 / 2) is written in the script header comment.

---

## Phase 2: Write the Script

### Entry Criteria
- Oracle defined.

### Actions
1. Create `.repro/` in `repo_path` and add `.repro/` to `.git/info/exclude` so it is never committed.
2. Write `.repro/repro.sh` (or `.repro/repro.ps1` on Windows-only bugs) that:
   1. Uses `set -u` and does not use `set -e` around the program call (the program is expected to fail; capture its exit code with `rc=$?`).
   2. Starts from a clean state: deletes temp output, caches and databases the program writes (list them explicitly), and builds the program with the stack's command:

| `stack` | Build step inside the script |
|---|---|
| python | none, or `python -m pip install -e . --no-deps` once; clear `__pycache__` only if the bug involves import |
| node | `npm ci --ignore-scripts` only if `node_modules` is absent; `npm run build` if the entry point is compiled TypeScript |
| go | `go build -o .repro/app ./cmd/<name>` |
| java | `mvn -q -DskipTests package` or `./gradlew -q assemble` |
| rust | `cargo build --locked` (add `--release` only if the reporter used a release build; many bugs differ between debug and release because of overflow checks and `debug_assert!`) |
| cpp | `cmake -S . -B .repro/build -DCMAKE_BUILD_TYPE=<reported type>` then `cmake --build .repro/build`; use the reported build type because optimization level changes undefined behavior outcomes |

   3. Runs the program with the literal failing input from `bug_brief.failing_input`, stdout and stderr captured to `.repro/last.log`.
   4. Applies the oracle with `grep -F` against `.repro/last.log` or the expected-value comparison.
   5. Exits 1, 0 or 2 per the contract.
3. If `replica_recipe.mode` is `container`, the run command is `docker run --rm -v "<repo_path>":/src -w /src repro-<name> bash .repro/repro.sh`. If `local`, prefix the switches from the recipe.
4. Do not change any source file in the repository in this flow.

### Output
`repro_script`.

### Quality Gate
- `git -C <repo_path> status --porcelain` shows no modified tracked files.
- Running the script once prints a log and returns 0, 1 or 2 (`echo $?`).

---

## Phase 3: Measure the Failure Rate

### Entry Criteria
- Script runs.

### Actions
1. Run it `confirm_runs` times and count exit codes: `for i in $(seq 1 <confirm_runs>); do bash .repro/repro.sh >/dev/null 2>&1; echo $?; done | sort | uniq -c`.
2. Fill `repro_rate`: exit 1 count is `failures_with_signature`, exit 2 count is `failures_other`, exit 0 count is `passes`.
3. Decide next step:

| Result | Next |
|---|---|
| `failures_with_signature` == `runs` | Deterministic; `repro-nondeterminism-pin` will pass it through |
| 0 < `failures_with_signature` < `runs` | Intermittent; `repro-nondeterminism-pin` must pin the source of randomness |
| `failures_with_signature` == 0 and `failures_other` == 0 | Does not reproduce; go back to `env_diff` rows marked unknown and ask the reporter |
| `failures_other` > 0 | Fix the script or build first; a different failure is not this bug |

### Output
`repro_rate`.

### Quality Gate
- The sum of the three counts equals `confirm_runs`.
- At least one exit 1 run has its signature line pasted into `repro_rate`.

---

## Worked Example

Illustrative only. `stack` = go, crash: `panic: assignment to entry in nil map` in `internal/cache/lru.go:57`. `confirm_runs` = 20 (user supplied).

- Phase 1: oracle `grep -F "assignment to entry in nil map" .repro/last.log`.
- Phase 2: script builds `go build -o .repro/app ./cmd/server`, runs `.repro/app --config testdata/reporter.yaml --once`, greps, exits 1 on match.
- Phase 3: `uniq -c` prints `20 1`. `repro_rate` = 20 of 20 with signature. Deterministic.

---

## Exit Criteria

DONE when `repro_script` exists outside version control with a 0/1/2 exit contract and `repro_rate` shows at least one run failing with the exact reported signature.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bug is performance-only | **Stop**: route to a benchmark flow; a boolean oracle will flap. |
| Phase 1 | No reported wait time for a hang | **Return**: ask the reporter; do not invent a timeout. |
| Phase 2 | Script needs a secret or production data | **Stop**: request a sanitized fixture; never embed credentials or customer data in `.repro/`. |
| Phase 3 | Zero reproductions | **Return**: send unknown `env_diff` rows to the reporter as questions. |
| Phase 3 | Weak model edits source to "make it fail" | **Stop**: revert with `git checkout -- <file>`; a repro must run unmodified code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
