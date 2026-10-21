# CLI stdin, stdout and stderr Discipline

**One-line description:** Makes the tool behave in pipelines: results only on stdout, diagnostics only on stderr, `-` and piped stdin read correctly, no hang when stdin is a terminal, output flushed and buffered correctly per stack, and a quiet exit with no traceback when the reader closes the pipe (`tool | head -1`).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract with the per-command stream lines.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `stream_contract` (object): Per command: stdout content, stderr content, stdin rule, buffering method, and the broken-pipe exit status chosen.
- `stdio_findings` (object[]): Each violation found by the pipeline probes, with the fix applied.

---

## Phase 1: Probe the Current Behavior

### Entry Criteria
- The tool runs as `RUN` (see `cli-help-usage-text`). A POSIX shell is available (Git Bash on Windows).

### Actions
1. Create a large input fixture so buffering and broken pipes show up: `seq 1 200000 | sed 's/^/2024-01-01T00:00:00Z INFO line /' > big.log`.
2. Run each probe and record the result:

| Probe | Command | Pass when |
|---|---|---|
| stdout holds only results | `RUN stats big.log 2>/dev/null` | output parses as the spec format |
| stderr holds only diagnostics | `RUN stats big.log >/dev/null` | no result lines appear |
| `-` reads stdin | `RUN stats - < big.log` | same stdout as with the file |
| pipe reads stdin | `cat big.log | RUN stats` | same stdout as with the file |
| no hang on a terminal | `RUN stats` typed in an interactive terminal, no file | prints usage or an error within a moment, does not wait for input |
| broken pipe | `RUN trim --older-than 1d big.log | head -1; echo "${PIPESTATUS[0]}"` | one line printed, no traceback or `EPIPE`/`Broken pipe` message, status recorded |
| missing file | `RUN stats nope.log; echo $?` | one line on stderr naming the file, spec runtime code |

3. Record each failure in `stdio_findings`.

### Output
Probe results.

### Quality Gate
- Every probe in the table has a recorded result and exit status.

---

## Phase 2: Fix Streams and stdin

### Entry Criteria
- Probe results recorded.

### Actions
1. Route every non-result print to stderr. Search for offenders first:

| Stack | Find stdout prints that are diagnostics | stderr call |
|---|---|---|
| python | `grep -rn "print(" src/` | `print(msg, file=sys.stderr)` or `logging` (its default handler writes to stderr) |
| node | `grep -rn "console.log" src/` | `console.error` or `process.stderr.write` |
| go | `grep -rn "fmt.Print" ./cmd ./internal` | `fmt.Fprintln(os.Stderr, ...)` or `cmd.ErrOrStderr()` |
| rust | `grep -rn "println!" src/` | `eprintln!` |

2. Implement the stdin rule: operand `-` or no operand means stdin. If no operand is given and stdin is a terminal, print the usage error instead of waiting:

| Stack | stdin is a terminal |
|---|---|
| python | `sys.stdin.isatty()` |
| node | `process.stdin.isTTY === true` |
| go | `term.IsTerminal(int(os.Stdin.Fd()))` from `golang.org/x/term` |
| rust | `std::io::stdin().is_terminal()` (`use std::io::IsTerminal`, Rust 1.70+) |

3. Fix buffering so large outputs are fast and nothing is lost:

| Stack | Behavior when stdout is a pipe | Fix |
|---|---|---|
| python | block-buffered | fine for bulk output; call `sys.stdout.flush()` before a long wait, or pass `flush=True` on progress-like stdout lines |
| node | writes may still be pending at exit | set `process.exitCode` and return; never `process.exit()` right after a write |
| go | `os.Stdout` is unbuffered, each write is a syscall | wrap: `w := bufio.NewWriter(os.Stdout); defer w.Flush()` |
| rust | `stdout` is line-buffered always | `let mut w = BufWriter::new(io::stdout().lock());` and `w.flush()?` at the end |

### Output
Stream and stdin fixes applied.

### Quality Gate
- The stdout and stderr probes from Phase 1 now pass.
- The grep from step 1 shows only result-printing lines left on stdout (read each remaining hit).

---

## Phase 3: Broken Pipe Exit

### Entry Criteria
- Streams fixed.

### Actions
1. Apply the stack's broken-pipe handling:

| Stack | Default when reader closes the pipe | Fix |
|---|---|---|
| python | `BrokenPipeError` traceback, often a second error at interpreter shutdown | Python docs recipe (signal module, "Note on SIGPIPE"): wrap `main` in `try/except BrokenPipeError:` then `devnull = os.open(os.devnull, os.O_WRONLY); os.dup2(devnull, sys.stdout.fileno()); sys.exit(1)` |
| node | `EPIPE` error event; crash with stack trace if unhandled | `process.stdout.on('error', e => { if (e.code === 'EPIPE') process.exit(0); throw e; })` |
| go | runtime exits by SIGPIPE when writing to a broken stdout or stderr (documented in `os/signal`), status 141 in bash | none needed; only add handling if you call `signal.Notify` for SIGPIPE |
| rust | SIGPIPE is ignored, so `println!` panics with `failed printing to stdout: Broken pipe` | write with `writeln!(w, ...)` and on `Err(e) if e.kind() == io::ErrorKind::BrokenPipe` return exit 0 quietly |

2. Record the resulting status in `stream_contract` (141, 0 or 1 by stack) and update the SIGPIPE row of `exit_code_table`.
3. Rerun the broken-pipe probe 3 times: the race between writer and `head` means one clean run proves nothing.

### Output
`stream_contract`, `stdio_findings`.

### Quality Gate
- `RUN trim --older-than 1d big.log 2>err.txt | head -1 >/dev/null; wc -c < err.txt` prints `0` in all 3 runs.
- `stream_contract` names the broken-pipe status for this stack.

---

## Do Not

- Do not catch every exception to hide the broken-pipe traceback; catch only the broken-pipe case.
- Do not write prompts or "Processing..." lines to stdout; they corrupt piped output.
- Do not claim the pipe probe passed from one run.

---

## Worked Example

Illustrative. Rust `logtrim` before Phase 3:
```
$ cargo run -q -- trim --older-than 1d big.log | head -1
2024-01-01T00:00:00Z INFO line 1
thread 'main' panicked at library/std/src/io/stdio.rs: failed printing to stdout: Broken pipe (os error 32)
```
After switching to `writeln!` on a `BufWriter` and returning quietly on `BrokenPipe`:
```
$ for i in 1 2 3; do cargo run -q -- trim --older-than 1d big.log 2>err.txt | head -1 >/dev/null; wc -c < err.txt; done
0
0
0
```

---

## Exit Criteria

DONE when every probe passes, `stream_contract` records the stream, stdin, buffering and broken-pipe rules per command, and no run under a closed pipe prints a traceback.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No POSIX shell on Windows | **Adjust**: run the probes in Git Bash or WSL; record which. |
| Phase 2 | A library prints to stdout on its own | **Adjust**: configure its stream (logging handler, progress library writer) to stderr. |
| Phase 3 | Python prints `Exception ignored ... BrokenPipeError` at shutdown | **Adjust**: the `dup2` of devnull onto stdout is missing; add it as in the recipe. |
| Phase 3 | Broken-pipe probe passes only sometimes | **Retry**: the fix is incomplete on some write path; search for other stdout writers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
