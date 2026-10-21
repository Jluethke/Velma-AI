# Go CLI End-to-End Tests with testscript

**One-line description:** Tests a Go CLI end to end with `github.com/rogpeppe/go-internal/testscript` (`.txtar` scripts that `exec` the real binary and check `stdout`, `stderr` and golden files) plus a small `os/exec` table test that asserts exact exit codes and signal behavior against a binary built in `TestMain`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Commands and flags to cover.
- `exit_code_table` (object[], required): Codes to assert.
- `help_text_snapshot` (string[], required): Snapshot files.
- `stream_contract` (object, required): Stream rules and broken-pipe status.
- `signal_policy` (object, required): SIGINT and SIGTERM statuses.
- `project_dir` (string, required): Root of the Go module.

---

## Outputs

- `e2e_test_files` (string[]): Paths of the test files and scripts created.
- `e2e_run_log` (string): Output of the final `go test` run.

---

## Phase 1: Wire testscript

### Entry Criteria
- `stack` == `go`; `main` delegates to a `run() int` function (see `cli-go-cobra-parser`).

### Actions
1. `go get github.com/rogpeppe/go-internal/testscript`.
2. Check the API of the version you got: `go doc github.com/rogpeppe/go-internal/testscript Main` and `go doc github.com/rogpeppe/go-internal/testscript RunMain`. Newer versions provide `Main(m, map[string]func())`; older ones provide `RunMain(m, map[string]func() int)`. Use whichever `go doc` shows as current.
3. Create `cmd/logtrim/main_test.go`:
```go
package main

import (
    "os"
    "testing"
    "github.com/rogpeppe/go-internal/testscript"
)

func TestMain(m *testing.M) {
    // older API shown; adapt to Main if go doc says RunMain is deprecated
    os.Exit(testscript.RunMain(m, map[string]func() int{"logtrim": run}))
}

func TestScript(t *testing.T) {
    testscript.Run(t, testscript.Params{Dir: "testdata/script"})
}
```
   The map registers `logtrim` as a command inside scripts that runs this package's `run` in a subprocess. No separate `go build` is needed for scripts.
4. testscript gives each script a fresh `$WORK` directory and sets `HOME` to a non-existent path, isolating user config. Add `env XDG_CONFIG_HOME=$WORK/.config` lines in scripts that test config.

### Output
`main_test.go`.

### Quality Gate
- `go test ./cmd/logtrim -run TestScript` reports `ok` with an empty `testdata/script` holding one trivial script (`exec logtrim --version`).

---

## Phase 2: Scripts

### Entry Criteria
- Harness runs.

### Actions
1. Create one `.txtar` per command in `testdata/script/`, for example `trim.txtar`:
```
# help goes to stdout, matches snapshot
exec logtrim trim --help
cmp stdout help-trim.txt
! stderr .

# unknown flag is a usage error on stderr only
! exec logtrim trim --older-than 1h --bogus
! stdout .
stderr 'unknown flag: --bogus'
stderr '--help'

# stdin via -
stdin in.log
exec logtrim trim --older-than 1h -
cmp stdout want.log

-- help-trim.txt --
(paste the snapshot file content here, regenerated from the tool)
-- in.log --
2024-01-01T00:00:00Z INFO old
-- want.log --
```
2. Script commands to use: `exec`, `! exec` (expects non-zero exit), `stdout REGEX`, `stderr REGEX`, `! stdout .` (stdout empty), `cmp FILE1 FILE2`, `stdin FILE`, `env K=V`, `exists`, `[windows] skip`. Read `go doc github.com/rogpeppe/go-internal/testscript` for the full list; do not invent commands.
3. `! exec` only asserts failure, not which code. Exact codes are covered in Phase 3.
4. To refresh golden sections after an intended change, run with `Params{UpdateScripts: true}` behind a test flag, then review the diff before committing.

### Output
Scripts for every command.

### Quality Gate
- Every command in `cli_spec` has a `.txtar` file (`ls testdata/script` against the command list).

---

## Phase 3: Exact Codes and Signals

### Entry Criteria
- Scripts pass.

### Actions
1. Create `cmd/logtrim/exit_test.go` that builds the binary once and asserts codes:
```go
var bin string

func buildBin(t *testing.T) string {
    t.Helper()
    if bin != "" { return bin }
    dir := t.TempDir()
    bin = filepath.Join(dir, "logtrim")
    if runtime.GOOS == "windows" { bin += ".exe" }
    out, err := exec.Command("go", "build", "-o", bin, ".").CombinedOutput()
    if err != nil { t.Fatalf("build: %v\n%s", err, out) }
    return bin
}

func TestExitCodes(t *testing.T) {
    cases := []struct{ args []string; want int }{
        {[]string{"--version"}, 0},
        {[]string{"trim", "--older-than", "1h", "--bogus"}, 2},
        {[]string{"trim", "--older-than", "1h", "missing.log"}, 1},
    }
    for _, c := range cases {
        err := exec.Command(buildBin(t), c.args...).Run()
        got := 0
        var ee *exec.ExitError
        if errors.As(err, &ee) { got = ee.ExitCode() } else if err != nil { t.Fatal(err) }
        if got != c.want { t.Errorf("%v: got %d want %d", c.args, got, c.want) }
    }
}
```
   `t.TempDir()` is removed when the first test that called it ends; build in `TestMain` into `os.MkdirTemp` instead if several tests share the binary.
2. SIGINT test with `//go:build !windows`: start the binary with a large input, wait for the ready marker on a stderr pipe, `cmd.Process.Signal(os.Interrupt)`, `cmd.Wait()`, assert `ExitCode() == 130`. A process killed by the signal reports `-1` from `ExitCode()`; that is a failure.
3. Run `go test ./... -count=1 -v > e2e.txt 2>&1; echo "exit=$?"`; save as `e2e_run_log`. `-count=1` disables test caching so the binary really runs.

### Output
`e2e_test_files`, `e2e_run_log`.

### Quality Gate
- `e2e_run_log` has no `FAIL` lines and ends with `ok` for each package, and `exit=0`.
- `TestExitCodes` lists every code in `exit_code_table` except signal and pipe codes.

---

## Do Not

- Do not edit golden sections by hand; regenerate and review.
- Do not rely on `go test` caching for e2e results; pass `-count=1`.
- Do not use `exec.Command("sh", "-c", ...)` for the binary; pass arguments directly.

---

## Worked Example

Illustrative.
```
$ go test ./cmd/logtrim -count=1 -run 'TestScript|TestExitCodes' -v
=== RUN   TestScript/trim
    testscript.go: > ! exec logtrim trim --older-than 1h --bogus
        [stderr]
        logtrim: unknown flag: --bogus
        Run 'logtrim --help' for usage.
        [exit status 2]
--- PASS: TestScript/trim (0.03s)
--- PASS: TestExitCodes (0.81s)
ok   example.com/logtrim/cmd/logtrim  1.102s
```

---

## Exit Criteria

DONE when every command has a testscript, exact exit codes and SIGINT are asserted against a built binary, and `go test -count=1 ./...` passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RunMain` deprecated or missing | **Adjust**: use `testscript.Main` with `func()` commands that call `os.Exit(run())`. |
| Phase 2 | `cmp stdout` fails on Windows only | **Adjust**: check line endings in the golden section; keep output `\n`. |
| Phase 3 | `ExitCode()` is -1 for SIGINT | **Return**: the tool lacks signal handling; send back to `cli-signal-sigint-handling`. |
| Phase 3 | Test fails | **Retry**: fix the tool; never change the expected code without a spec change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
