# Rust CLI End-to-End Tests with assert_cmd and trycmd

**One-line description:** Tests a Rust CLI binary end to end with `assert_cmd` and `predicates` for exact exit codes and per-stream assertions, `assert_fs` for isolated files, and `trycmd` snapshot cases for help and usage screens, plus Unix-only SIGINT and broken-pipe tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Commands and flags to cover.
- `exit_code_table` (object[], required): Codes to assert.
- `help_text_snapshot` (string[], required): Snapshot files.
- `stream_contract` (object, required): Stream rules and broken-pipe status.
- `signal_policy` (object, required): SIGINT and SIGTERM statuses.
- `project_dir` (string, required): Root of the Cargo package.

---

## Outputs

- `e2e_test_files` (string[]): Paths of the integration tests and trycmd case files.
- `e2e_run_log` (string): Output of the final `cargo test` run.

---

## Phase 1: Dependencies and Harness

### Entry Criteria
- `stack` == `rust`; the package has a `[[bin]]` (or `src/main.rs`).

### Actions
1. Add dev dependencies: `cargo add --dev assert_cmd predicates assert_fs trycmd`.
2. Create `tests/cli.rs`. Build the command through one helper:
```rust
use assert_cmd::Command;

fn tool(home: &std::path::Path) -> Command {
    let mut c = Command::cargo_bin("logtrim").unwrap();
    c.env_clear()
        .env("PATH", std::env::var_os("PATH").unwrap_or_default())
        .env("HOME", home).env("XDG_CONFIG_HOME", home.join(".config"))
        .env("APPDATA", home.join("AppData")).env("NO_COLOR", "1");
    c
}
```
3. Check the `assert_cmd` docs for your version: newer releases may mark `Command::cargo_bin` deprecated in favor of a `cargo_bin!` macro. If `cargo build --tests` warns, switch to the form the warning names.
4. `env_clear()` removes every inherited variable, including any `LOGTRIM_*` set on the developer machine. On Windows, also pass `SystemRoot` through, because some system calls fail without it.

### Output
`tests/cli.rs` with the helper.

### Quality Gate
- `cargo test --test cli` compiles and runs (zero tests is acceptable at this point).

---

## Phase 2: Contract Assertions

### Entry Criteria
- Helper compiles.

### Actions
1. Add tests:
```rust
use predicates::prelude::*;

#[test]
fn unknown_flag_is_usage_error() {
    let home = assert_fs::TempDir::new().unwrap();
    tool(home.path()).args(["trim", "--older-than", "1d", "--bogus"])
        .assert()
        .code(2)
        .stdout(predicate::str::is_empty())
        .stderr(predicate::str::contains("unexpected argument '--bogus'"));
}

#[test]
fn stdin_dash_matches_file() {
    let home = assert_fs::TempDir::new().unwrap();
    let data = "2024-01-01T00:00:00Z INFO a\n";
    let from_stdin = tool(home.path()).args(["stats", "-"]).write_stdin(data).assert().success();
    let f = home.path().join("a.log");
    std::fs::write(&f, data).unwrap();
    let from_file = tool(home.path()).args(["stats"]).arg(&f).assert().success();
    assert_eq!(from_stdin.get_output().stdout, from_file.get_output().stdout);
}
```
2. Cover: version (`code(0)`, stdout contains `env!("CARGO_PKG_VERSION")`), usage error per command, missing file (runtime code, stderr names it), env var effect, and `stderr(predicate::str::contains("panicked").not())` on every failing-path test.
3. Snapshot help and usage with trycmd. Create `tests/cmd/trim-help.toml`:
```toml
bin.name = "logtrim"
args = ["trim", "--help"]
status.code = 0
```
   with the expected stdout in `tests/cmd/trim-help.stdout`, and add:
```rust
#[test]
fn cli_snapshots() { trycmd::TestCases::new().case("tests/cmd/*.toml"); }
```
4. Generate expected files with `TRYCMD=overwrite cargo test cli_snapshots`, then read every generated file before committing. Copy `help_text_snapshot` content into them only by regenerating from the tool.

### Output
Contract and snapshot tests.

### Quality Gate
- Every command in `cli_spec` has a `-help.toml` and a usage-error test.
- Every non-signal code in `exit_code_table` appears in a `.code(N)` assertion or a `status.code`.

---

## Phase 3: Signals, Pipes and Full Run

### Entry Criteria
- Contract tests pass.

### Actions
1. Unix-only SIGINT test (`#[cfg(unix)]`), using `std::process::Command` (not assert_cmd, which waits for exit): spawn with `Stdio::piped()` stderr, read until the ready marker, send SIGINT with `nix::sys::signal::kill(nix::unistd::Pid::from_raw(child.id() as i32), nix::sys::signal::Signal::SIGINT)` (`cargo add --dev nix --features signal`), then `child.wait()` and assert `status.code() == Some(130)`. `code()` is `None` when the process died by the signal.
2. Broken pipe test (`#[cfg(unix)]`): spawn with piped stdout, read one line, drop the stdout handle, wait, assert the `stream_contract` status and that stderr has no `panicked` or `Broken pipe`.
3. Run `cargo test --all-targets > e2e.txt 2>&1; echo "exit=$?"`; save as `e2e_run_log`.

### Output
`e2e_test_files`, `e2e_run_log`.

### Quality Gate
- `e2e_run_log` shows `test result: ok` for every test binary and `exit=0`.
- The SIGINT test asserts `Some(130)`, not just non-success.

---

## Do Not

- Do not assert `.failure()` where the spec defines an exact code; use `.code(N)`.
- Do not accept `TRYCMD=overwrite` output without reading it.
- Do not skip the Unix tests on Linux CI; only Windows may skip them.

---

## Worked Example

Illustrative.
```
$ cargo test --test cli
running 7 tests
test unknown_flag_is_usage_error ... ok
test broken_pipe_is_quiet ... FAILED
---- broken_pipe_is_quiet stdout ----
stderr: thread 'main' panicked at ... failed printing to stdout: Broken pipe
```
Sent back to `cli-stdio-stream-discipline` Phase 3. After the fix:
```
test result: ok. 7 passed; 0 failed; 0 ignored
```

---

## Exit Criteria

DONE when contract, snapshot, signal and pipe tests pass against the real binary in an isolated environment and `e2e_run_log` shows no failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cargo_bin` deprecation warning | **Adjust**: use the replacement named in the warning. |
| Phase 2 | trycmd diff only in wrapping | **Adjust**: set a fixed `term_width` in the clap command or `COLUMNS` in the case `env`. |
| Phase 3 | `status.code()` is `None` | **Return**: the tool died by the signal; send back to `cli-signal-sigint-handling`. |
| Phase 3 | Test fails | **Retry**: fix the binary; do not loosen `.code(N)` to `.failure()`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
