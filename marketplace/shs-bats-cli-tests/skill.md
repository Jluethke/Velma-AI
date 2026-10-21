# bats-core CLI Behavior Tests

**One-line description:** Turns the recorded CLI interface and exit code table into bats-core tests that call the script with `run`, check exit status with `run -N` or `assert_failure N`, check stdout and stderr separately with `run --separate-stderr`, use `$BATS_TEST_TMPDIR` for files, and fail when behavior drifts, without ever weakening an assertion to make a test pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script under test.
- `bats_harness` (object, required): From `shs-bats-harness-setup`.
- `cli_interface` (object, required): From `shs-getopts-arg-parsing`.
- `exit_code_table` (object[], required): From `shs-exit-status-contract`.

---

## Outputs

- `bats_tests` (object): Test file path, the list of test names mapped to the interface case or exit code each covers, and the final run result.

---

## Phase 1: Plan One Test Per Behavior

### Entry Criteria
- The smoke test in `bats_harness` passes.

### Actions
1. Make a test list with exactly one row per item:
   - Each `cli_interface` case (help, unknown option, missing value, missing operand, spaces in values, `--` handling).
   - Each `exit_code_table` row that is reachable without root or network.
   - Each main success path (one per distinct output).
2. For each row write: test name, command, expected exit code, expected stdout fragment, expected stderr fragment, files expected to exist afterward.
3. Tests that need an external command's behavior (network, `systemctl`) go to `shs-bats-command-stubs`; mark them here and skip them in this flow.

### Output
Test plan table.

### Quality Gate
- Every `cli_interface` case and every reachable exit code has a planned test.

---

## Phase 2: Write the Tests

### Entry Criteria
- Plan complete.

### Actions
1. Create `test/<script-name>.bats`:

```bash
#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

setup() {
  load 'test_helper/common-setup'
  _common_setup
}

@test "-h prints usage on stdout and exits 0" {
  run --separate-stderr -0 pack -h
  assert_output --partial 'Usage: pack'
  [ -z "$stderr" ]
}

@test "unknown option exits 2 with message on stderr" {
  run --separate-stderr -2 pack -z a.txt
  assert_output ''
  [[ $stderr == *"unknown option -z"* ]]
}

@test "missing input file exits 66" {
  run -66 pack "$BATS_TEST_TMPDIR/nope.txt"
}

@test "writes archive for file with spaces" {
  printf 'x\n' > "$BATS_TEST_TMPDIR/a b.txt"
  run -0 pack -o "$BATS_TEST_TMPDIR/out" "$BATS_TEST_TMPDIR/a b.txt"
  assert_file_exists "$BATS_TEST_TMPDIR/out/a b.txt.gz"
}
```

2. Rules for every test:
   - Always call the script through `run`; a bare failing command fails the test with less useful output.
   - Check status with `run -N` (bats 1.5.0+) or `assert_success` / `assert_failure N`.
   - `$output` combines stdout and stderr unless `--separate-stderr` is given, then stderr is in `$stderr`.
   - Use `$BATS_TEST_TMPDIR` (unique per test, removed after) for every file. Never write into the repository or `/tmp` directly.
   - One behavior per `@test`.
3. Write one test, run it (`test/bats/bin/bats -f '<name>' test/<file>.bats`), then write the next.

### Output
Test file.

### Quality Gate
- `test/bats/bin/bats --count test/<file>.bats` equals the number of planned rows not deferred to stubs.

---

## Phase 3: Run and Prove the Tests Can Fail

### Entry Criteria
- Tests written.

### Actions
1. Run all: `test/bats/bin/bats -r test/; echo "rc=$?"`.
2. Mutation check: temporarily change one exit code in the script (for example the usage error from 2 to 1), rerun, confirm the matching test fails with `not ok`, then revert the change and confirm `git diff -- "$script_path"` is empty.
3. If a test fails on the real script, the test plan or the script is wrong. Decide by reading `cli_interface`: if the script disagrees with the recorded contract, fix the script. Do NOT edit the assertion to match wrong behavior, and do NOT add `skip` to get green.
4. Save JUnit output for CI if needed: `test/bats/bin/bats --report-formatter junit --output test-results/ -r test/`.

### Output
`bats_tests`.

### Quality Gate
- Full run prints `0 failures` and `rc=0`.
- The mutation run showed at least one `not ok`, and the revert restored a clean `git diff`.

---

## Worked Example

Illustrative only.

```
$ test/bats/bin/bats test/pack.bats
pack.bats
 ✓ -h prints usage on stdout and exits 0
 ✓ unknown option exits 2 with message on stderr
 ✓ missing input file exits 66
 ✓ writes archive for file with spaces

4 tests, 0 failures
```
Mutation (usage exit changed to 1):
```
 ✗ unknown option exits 2 with message on stderr
   (in test file test/pack.bats, line 17)
     `run --separate-stderr -2 pack -z a.txt' failed, expected exit code 2, got 1
```
Reverted; rerun shows `4 tests, 0 failures`.

---

## Exit Criteria

DONE when every interface case and reachable exit code has a passing test and the mutation check proved the suite detects a change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `run -N` rejected | **Adjust**: add `bats_require_minimum_version 1.5.0` or upgrade bats. |
| Phase 3 | Test passes on mutated script | **Adjust**: the assertion is too loose (for example only `assert_failure`); assert the exact code and message. |
| Phase 3 | Test fails because the script is wrong | **Return**: fix the script in the owning flow (exit codes, parsing); never weaken the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
