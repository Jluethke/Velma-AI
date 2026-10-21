# Dependency Upgrade Baseline Snapshot

**One-line description:** Records the exact pre-upgrade state (commit, lockfile hashes, runtime, test results, collected test count, deprecation warning count) so every later step can prove it changed nothing it was not supposed to change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `repo_path`, `install_command`, `test_command`, `build_command`, `lockfile`, `work_dir`.

---

## Outputs

- `baseline_report` (object): `baseline_sha`, `lockfile_hashes`, `runtime_version`, `install_ok`, `build_ok`, `tests_collected`, `tests_passed`, `tests_failed`, `pre_existing_failures` (test ids), `flaky_tests` (test ids), `deprecation_warning_count`, `deprecation_warnings_file`. Also written to `<work_dir>/baseline.json`.

---

## Phase 1: Freeze The Starting Point

### Entry Criteria
- `<work_dir>/scope.json` exists and `git status --porcelain` is empty.

### Actions
1. `git -C <repo_path> rev-parse HEAD` and record it as `baseline_sha`. Also tag it locally: `git tag dep-baseline-<YYYYMMDD> <baseline_sha>`. Do not push the tag.
2. Hash each lockfile with `git hash-object <lockfile>` and record name to hash in `lockfile_hashes`.
3. Run `install_command` exactly as recorded. Save output: `<install_command> > <work_dir>/baseline-install.log 2>&1; echo $? > <work_dir>/baseline-install.exit`.
4. After install, confirm the lockfile did not change: `git status --porcelain` must still be empty. If the install rewrote the lockfile, record `install_ok=false` with reason `lockfile drift` (the lockfile hygiene flow fixes it).

### Output
`baseline_sha`, `lockfile_hashes`, `install_ok`.

### Quality Gate
- `<work_dir>/baseline-install.exit` contains `0`, or `install_ok=false` has a written reason.
- `git tag --list 'dep-baseline-*'` prints the new tag.

---

## Phase 2: Run Build And Tests Twice

### Entry Criteria
- Install exit code is 0.

### Actions
1. Run `build_command` and save the log and exit code the same way as install (`baseline-build.log`, `baseline-build.exit`).
2. Count collected tests with the command for the stack, and save the number as `tests_collected`:

| Stack / runner | Count command |
|---|---|
| pytest | `pytest --collect-only -q \| tail -n 1` (prints `N tests collected`) |
| Django test runner | `python manage.py test --verbosity 2 2>&1 \| grep -c ' ok$'` after the run |
| jest | `npx jest --listTests \| wc -l` (counts files, record as files) |
| vitest | `npx vitest list \| wc -l` |
| go | `go test -list '.*' ./... \| grep -cE '^(Test\|Example\|Fuzz)'` |
| cargo | `cargo test --locked -- --list \| grep -c ': test$'` |
| maven / gradle | read `Tests run:` totals from the surefire report or `build/test-results` XML |

3. Run `test_command` twice, saving `baseline-tests-1.log` and `baseline-tests-2.log`. Use a machine-readable report where the runner supports one: pytest `--junitxml=<work_dir>/baseline-1.xml`, jest `--json --outputFile=<work_dir>/baseline-1.json`, go `go test -json ./...`, maven and gradle already write JUnit XML.
4. Classify every failing test id with this table:

| Run 1 | Run 2 | Class |
|---|---|---|
| fail | fail | `pre_existing_failures` |
| fail | pass | `flaky_tests` |
| pass | fail | `flaky_tests` |

5. Do not fix, skip or delete any failing test. The baseline records reality.

### Output
`build_ok`, `tests_collected`, `tests_passed`, `tests_failed`, `pre_existing_failures`, `flaky_tests`.

### Quality Gate
- Both test logs exist and each ends with the runner's summary line.
- Every failing id appears in exactly one of `pre_existing_failures` or `flaky_tests`.

---

## Phase 3: Count Deprecation Warnings

### Entry Criteria
- Test logs exist.

### Actions
1. Re-run the test suite with deprecation warnings visible, writing to `<work_dir>/baseline-deprecations.log`:
   - python: `PYTHONWARNINGS=default <test_command>`; with pytest also add `-W default::DeprecationWarning -W default::PendingDeprecationWarning -rw`.
   - node: `NODE_OPTIONS=--trace-deprecation <test_command>`.
   - go: `go vet ./... 2>&1` and `staticcheck ./...` if installed (check SA1019 "is deprecated").
   - rust: `cargo build --locked --all-targets 2>&1 | grep -A3 'use of deprecated'`.
   - jvm: maven `-Dmaven.compiler.showDeprecation=true` with `verify`; gradle add `options.compilerArgs << "-Xlint:deprecation"` only if the user approves a build file change, otherwise grep existing output for `has been deprecated`.
2. Count unique warning lines (strip line numbers): `grep -iE 'deprecat' <work_dir>/baseline-deprecations.log | sed -E 's/:[0-9]+(:[0-9]+)?//' | sort -u | wc -l`. Record as `deprecation_warning_count`.
3. Write `<work_dir>/baseline.json`.

### Output
`baseline_report` and `<work_dir>/baseline.json`.

### Quality Gate
- `deprecation_warning_count` is a number produced by the command in step 2, with the log path recorded.
- `<work_dir>/baseline.json` parses: `python -m json.tool <work_dir>/baseline.json` exits 0.

---

## Worked Example

Illustrative only. Scope: npm project, `test_command="npm test"` (jest).

- Phase 1: `baseline_sha=8c1f2e0`, tag `dep-baseline-20261020`; `npm ci` exit 0; `git status --porcelain` empty.
- Phase 2: `npx jest --listTests | wc -l` prints `212`. Run 1: 1 failed (`checkout.spec.ts > applies coupon`), run 2: all pass, so `flaky_tests=["checkout.spec.ts > applies coupon"]`, `pre_existing_failures=[]`.
- Phase 3: `NODE_OPTIONS=--trace-deprecation npm test` logs `[DEP0040] DeprecationWarning: The punycode module is deprecated.` with a stack trace into `node_modules/whatwg-url`. Unique count: `deprecation_warning_count=3`.

---

## Exit Criteria

DONE when `<work_dir>/baseline.json` records the commit, lockfile hashes, install/build/test results from two runs, test count and deprecation count, each backed by a saved log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Install fails at baseline | **Stop**: the project is broken before any upgrade; report the log tail. Upgrading on a broken base hides cause. |
| Phase 1 | Install rewrites the lockfile | **Return**: set `install_ok=false`, reason `lockfile drift`; run the lockfile hygiene flow next. |
| Phase 2 | Test suite cannot run (`test_command=NONE`) | **Return**: record `tests_collected=0`; every later gate that compares tests becomes an open question for the user. |
| Phase 2 | Many failures at baseline | **Adjust**: record them all as pre-existing; never fix tests in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
