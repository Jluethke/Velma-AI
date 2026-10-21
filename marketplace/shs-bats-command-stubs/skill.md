# Stub External Commands in bats Tests

**One-line description:** Tests the parts of a script that call `curl`, `systemctl`, `aws`, `git` or other external programs by putting executable stub scripts first on `PATH` inside `$BATS_TEST_TMPDIR`, recording each call's arguments to a log file, returning canned output and exit codes, and asserting the exact calls made, so tests run offline and never touch real systems.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script under test.
- `bats_harness` (object, required): From `shs-bats-harness-setup`.

---

## Outputs

- `command_stubs` (object): Commands stubbed, the stub helper file, tests added with the calls each asserts, and the run result.

---

## Phase 1: Inventory External Calls

### Entry Criteria
- The bats harness runs.

### Actions
1. List commands with side effects or network access in the script: `grep -nE '\b(curl|wget|ssh|scp|rsync|systemctl|service|aws|gcloud|az|kubectl|docker|git|apt-get|apk|dnf|mail|sendmail)\b' "$script_path"`.
2. For each, check how it is invoked:
   - By name (`curl ...`): PATH stubs work.
   - By absolute path (`/usr/bin/curl`): PATH stubs are bypassed. Change the script to call by name, or to use an overridable variable `CURL=${CURL:-curl}` and call `"$CURL"`.
   - If the script resets `PATH` (common for cron), make it prepend instead of replace, or let tests override the variable.
3. Decide stub behavior per test: canned stdout, exit code, and whether stdin matters.

### Output
Stub plan.

### Quality Gate
- Every listed command is callable by name or through an overridable variable.

---

## Phase 2: Write the Stub Helper

### Entry Criteria
- Plan complete.

### Actions
1. Create `test/test_helper/stub.bash`:

```bash
# make_stub NAME EXIT_CODE [STDOUT_TEXT]
make_stub() {
  local name=$1 code=$2 out=${3:-}
  mkdir -p "$BATS_TEST_TMPDIR/bin"
  printf '%s\n' "$out" > "$BATS_TEST_TMPDIR/$name.out"
  cat > "$BATS_TEST_TMPDIR/bin/$name" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$BATS_TEST_TMPDIR/$name.calls"
cat "$BATS_TEST_TMPDIR/$name.out"
exit $code
EOF
  chmod +x "$BATS_TEST_TMPDIR/bin/$name"
  PATH="$BATS_TEST_TMPDIR/bin:$PATH"
}

# stub_calls NAME  -> prints recorded argument lines
stub_calls() { cat "$BATS_TEST_TMPDIR/$1.calls" 2>/dev/null || true; }
```

   `$*` joins arguments with spaces, which loses the boundary between `"a b"` and `a b`. When a test must check argument boundaries, record with `printf '[%s]' "\$@"` instead.
2. Load it in `setup()` after `_common_setup`: `load 'test_helper/stub'`.
3. Alternative: the `bats-mock` library (`github.com/jasonkarns/bats-mock`) offers `stub curl '...'` with argument matching. Use it only if already in the project; the helper above has no dependency.

### Output
Stub helper.

### Quality Gate
- The helper file exists and a throwaway test calling `make_stub foo 0 hi; run foo; assert_output hi` passes.

---

## Phase 3: Write Stubbed Tests

### Entry Criteria
- Helper loads.

### Actions
1. One test per external interaction outcome: success, failure exit code, unexpected output.

```bash
@test "deploy restarts the service once on success" {
  make_stub systemctl 0
  make_stub curl 0 '{"status":"ok"}'
  run -0 deploy --env staging
  assert_equal "$(stub_calls systemctl)" "restart app.service"
  assert_equal "$(stub_calls curl | wc -l | tr -d ' ')" "1"
}

@test "deploy exits 69 and does not restart when health check fails" {
  make_stub systemctl 0
  make_stub curl 22
  run -69 deploy --env staging
  assert_equal "$(stub_calls systemctl)" ""
}
```

   `curl` exit 22 is what `curl --fail` returns on an HTTP error of 400 or above; the second test only passes if the script uses `--fail` (or `--fail-with-body`) and checks it.
2. Assert the absence of calls on failure paths (no restart after a failed check).
3. Run each new test immediately: `test/bats/bin/bats -f 'deploy' test/`.
4. Never let a test reach a real external command: stub every Phase 1 command that the tested path calls, and point any file changes at a test root (for example `--root "$BATS_TEST_TMPDIR"`). Do NOT stub core utilities such as `rm` or `mkdir`; isolate them with the test root instead.

### Output
`command_stubs`.

### Quality Gate
- Full suite passes: `test/bats/bin/bats -r test/` prints `0 failures`.
- Running the suite with networking disabled (`unshare -n` on Linux as root, or with the network off) still passes, proving no real calls.

---

## Worked Example

Illustrative only.

Script `bin/deploy` calls `curl --fail -sS "$url/health"` then `systemctl restart app.service`.

```
$ test/bats/bin/bats test/deploy.bats
deploy.bats
 ✓ deploy restarts the service once on success
 ✓ deploy exits 69 and does not restart when health check fails

2 tests, 0 failures
$ cat "$BATS_TEST_TMPDIR/systemctl.calls"      # inside a debug run
restart app.service
```

---

## Exit Criteria

DONE when every external interaction has success and failure tests using stubs, asserted call logs, and the suite passes offline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Script calls commands by absolute path | **Adjust**: introduce an overridable variable per command; change only those call sites. |
| Phase 3 | Stub never called (empty `.calls`) | **Adjust**: the script found the real binary first; print `PATH` inside the test and check the script does not reset it. |
| Phase 3 | Real command ran during a test | **Stop**: remove the test, add the stub, and check for damage before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
