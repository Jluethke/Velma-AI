# CLI SIGINT and SIGTERM Handling

**One-line description:** Makes Ctrl-C and `kill` behave correctly per stack: cleanup of temp files and partial outputs, exit status 130 for SIGINT and 143 for SIGTERM, a second Ctrl-C that forces exit, no traceback, and a test that delivers the signal reliably (avoiding the ignored-SIGINT trap of background jobs in scripts).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `exit_code_table` (object[], required): Contains the 130 and 143 rows.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `signal_policy` (object): What each signal does, the cleanup steps, the exit status, and the second-signal rule.
- `signal_findings` (object[]): Each test result and defect fixed.

---

## Phase 1: Inventory What Needs Cleanup

### Entry Criteria
- `exit_code_table` has rows for 130 and 143.

### Actions
1. List every resource a long operation creates: temp files, a partially written output file, lock files, child processes, a hidden cursor, terminal mode changes.
2. Apply this rule for output files: write to a temp file in the same directory, then rename over the target only after success (`os.replace`, `fs.renameSync`, `os.Rename`, `std::fs::rename`). An interrupted run then leaves the original untouched.
3. Record the policy:

| Event | Action | Exit status |
|---|---|---|
| first SIGINT | stop work, run cleanup, print nothing or one short line to stderr | 130 |
| second SIGINT during cleanup | exit at once without further cleanup | 130 |
| SIGTERM | same cleanup as SIGINT | 143 |
| SIGPIPE | per `stream_contract` | per `stream_contract` |

### Output
Draft `signal_policy`.

### Quality Gate
- Every resource from step 1 has a cleanup step in the policy.

---

## Phase 2: Implement per Stack

### Entry Criteria
- Policy drafted.

### Actions
1. Implement with the stack's mechanism:

**python**
- SIGINT raises `KeyboardInterrupt` in the main thread. Catch it once, at the top of `main`:
```python
def _on_sigterm(signum, frame):
    raise SystemExit(143)

def main(argv=None) -> int:
    signal.signal(signal.SIGTERM, _on_sigterm)
    try:
        return run(argv)
    except KeyboardInterrupt:
        print("interrupted", file=sys.stderr)
        return 130
```
- Put cleanup in `try/finally` blocks and context managers (`tempfile.TemporaryDirectory()`), which run during both exceptions.
- By default SIGTERM kills a Python process without running `finally` blocks; `_on_sigterm` converts it to `SystemExit(143)` so they run.
- click and typer turn Ctrl-C into `Aborted!` and exit 1; use the wrapper from `cli-py-click-parser` Phase 2 to return 130.

**node**
- Adding a `process.on('SIGINT', ...)` listener removes Node's default exit, so the handler must end the process:
```js
const ac = new AbortController();
let interrupted = false;
function onSignal(code) {
  if (interrupted) process.exit(code);   // second signal: leave now
  interrupted = true;
  ac.abort();                              // long tasks watch ac.signal
  cleanup().finally(() => { process.exitCode = code; });
}
process.on('SIGINT', () => onSignal(130));
process.on('SIGTERM', () => onSignal(143));
```
- Windows: Node emulates SIGINT for Ctrl-C in a console; `SIGTERM` can be listened for but is never sent by Windows, so `kill` from another process ends the program without the handler.

**go**
```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
err := root.ExecuteContext(ctx)
if ctx.Err() != nil { cleanup(); return 130 } // return from run(), main calls os.Exit
```
- Inside work loops check `ctx.Done()`. After the first signal, call `stop()`; that restores default handling so a second Ctrl-C kills the process (documented in `os/signal`).
- To tell SIGINT from SIGTERM, use `signal.Notify(ch, ...)` with a channel instead and record which arrived. `syscall.SIGTERM` exists on Windows in Go but is not delivered by Windows consoles.
- `os.Exit` skips `defer`; run cleanup before returning the code.

**rust**
- The default SIGINT action kills the process without running `Drop`, so `tempfile::NamedTempFile` is not removed. Install a handler:
```rust
let flag = Arc::new(AtomicBool::new(false));
let f = flag.clone();
ctrlc::set_handler(move || {
    if f.swap(true, Ordering::SeqCst) { std::process::exit(130); } // second Ctrl-C
})?;
// in work loops: if flag.load(Ordering::SeqCst) { cleanup(); return Ok(ExitCode::from(130)); }
```
- `ctrlc` handles SIGTERM too only with its `termination` feature; to tell them apart use `signal-hook` (`signal_hook::flag::register(SIGTERM, flag)`). In async code use `tokio::signal::ctrl_c()`.

2. Child processes: in a terminal, Ctrl-C reaches the whole foreground process group, so children get SIGINT too. Wait for them to exit before returning; do not leave orphans.

### Output
Signal handling implemented.

### Quality Gate
- The code has exactly one SIGINT handler or catch site (search: `KeyboardInterrupt`, `on('SIGINT'`, `NotifyContext`/`signal.Notify`, `ctrlc::set_handler`).

---

## Phase 3: Test Signal Delivery

### Entry Criteria
- Handling implemented.

### Actions
1. Add a hidden test hook or use a large input so the command runs long enough to signal, and have it print a ready marker to stderr (for example `started`) when work begins. Wait for the marker, never for a fixed sleep.
2. Send the signal from a test harness, not from a shell script background job. In a non-interactive shell, commands started with `&` have SIGINT ignored (POSIX), and Python does not install its `KeyboardInterrupt` handler when SIGINT is ignored at startup, so a `kill -INT` test from a plain script gives a false result. If you must use bash, run `set -m` first to enable job control.
3. Harness snippets:
```python
p = subprocess.Popen([sys.executable, "-m", "logtrim", "trim", "--older-than", "1d", str(big)],
                     stderr=subprocess.PIPE, text=True)
assert p.stderr.readline().strip() == "started"
p.send_signal(signal.SIGINT)
assert p.wait(timeout=30) == 130
```
   Go: `cmd.Process.Signal(os.Interrupt)` then `cmd.Wait()` and `exitErr.ExitCode()`. Rust: `nix::sys::signal::kill(Pid::from_raw(child.id() as i32), Signal::SIGINT)`. Node: `child.kill('SIGINT')` and read `code` in the `exit` event.
4. Check after each run: exit status, stderr has no traceback, target file unchanged (compare `sha256sum` before and after), temp directory empty.
5. Mark these tests POSIX-only (`skipif(sys.platform == "win32")`, `//go:build !windows`, `#[cfg(unix)]`).

### Output
`signal_policy`, `signal_findings`.

### Quality Gate
- SIGINT test reports exit 130 and SIGTERM test reports 143.
- `sha256sum` of the target file matches before and after the interrupted run.

---

## Do Not

- Do not catch SIGINT and continue working.
- Do not call `sys.exit`, `process.exit` or `os.Exit` from deep inside work code to handle a signal; return to `main`.
- Do not use `sleep N` to wait for the process to start; wait for the ready marker.

---

## Worked Example

Illustrative. Python test before the fix, using `kill -INT` from a bash script:
```
$ ./sigtest.sh
exit=0       # SIGINT was ignored in the background job; test meaningless
```
Moved to a pytest harness with `Popen.send_signal`:
```
$ python -m pytest tests/test_signals.py -q
F
E   assert 1 == 130          # click printed "Aborted!" and exited 1
```
After the click wrapper returns 130 and output is written via temp file plus `os.replace`:
```
$ python -m pytest tests/test_signals.py -q
..                                                        [100%]
2 passed in 1.42s
```

---

## Exit Criteria

DONE when SIGINT exits 130 and SIGTERM 143 after cleanup, a second Ctrl-C exits at once, interrupted runs leave target files unchanged, and harness-delivered signal tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output is written in place with no temp file | **Adjust**: switch to temp file plus rename before testing signals. |
| Phase 2 | Handler blocks on slow cleanup | **Adjust**: the second-signal rule must exit immediately; confirm it in the code. |
| Phase 3 | Test exits 0 or hangs | **Retry**: confirm the signal is sent from the harness, not a script background job. |
| Phase 3 | Windows CI fails the signal tests | **Adjust**: mark them POSIX-only; record Windows behavior in `signal_policy`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
