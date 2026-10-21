# CLI TTY Detection and Color

**One-line description:** Implements one color decision per output stream from `--color=auto|always|never`, `NO_COLOR`, `FORCE_COLOR`, `CLICOLOR_FORCE`, `TERM=dumb` and per-stream TTY detection, enables ANSI on Windows consoles, and proves with byte-level checks that piped output contains no escape codes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stream_contract` (object, required): From `cli-stdio-stream-discipline`; says which streams carry human text.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `color_policy` (object): The precedence order, the library used, and the function that answers "color on this stream?".
- `tty_findings` (object[]): Each place escape codes leaked into non-TTY output, or color ignored a setting, with the fix.

---

## Phase 1: Decide the Policy

### Entry Criteria
- `stream_contract` exists.

### Actions
1. Use this precedence, first match wins, evaluated separately for stdout and stderr:

| Order | Condition | Color |
|---|---|---|
| 1 | `--color=never` (or `--no-color`) | off |
| 2 | `--color=always` | on |
| 3 | `NO_COLOR` set and not empty (no-color.org) | off |
| 4 | `FORCE_COLOR` set and not `0`, or `CLICOLOR_FORCE` set and not `0` | on |
| 5 | `TERM` == `dumb` | off |
| 6 | this stream is a TTY | on |
| 7 | otherwise | off |

2. Write it as one function, `use_color(stream) -> bool`, in one module. Every colored print calls it. Do not test the TTY in several places.
3. Pick the TTY test per stack:

| Stack | Is this stream a terminal |
|---|---|
| python | `stream.isatty()` |
| node | `stream.isTTY === true` (`undefined` when piped) |
| go | `term.IsTerminal(int(f.Fd()))` (`golang.org/x/term`) or `isatty.IsTerminal(f.Fd()) || isatty.IsCygwinTerminal(f.Fd())` (`github.com/mattn/go-isatty`, the second call covers Git Bash/mintty) |
| rust | `std::io::IsTerminal::is_terminal(&io::stdout())` |

### Output
Draft `color_policy`.

### Quality Gate
- The policy lists all 7 rows and names one function that implements it.

---

## Phase 2: Implement with the Stack's Library

### Entry Criteria
- Policy drafted.

### Actions
1. Wire the library so it obeys the function, not its own guess:

| Stack | Library | How to force the decision |
|---|---|---|
| python | rich | `on = use_color(sys.stderr)` then `Console(stderr=True, force_terminal=on, no_color=not on)`; rich reads `NO_COLOR` and `FORCE_COLOR` itself, so pass the flag decision explicitly to make `--color` win |
| python | click | `click.echo(click.style(...), color=use_color(stream))`; with `color=None` click strips styles when the stream is not a terminal |
| node | chalk | `new Chalk({ level: useColor(process.stdout) ? 1 : 0 })` (chalk 5 is ESM-only) |
| node | built-in | `util.styleText` (check your Node version's docs for its stream and env handling) |
| go | fatih/color | `color.NoColor = !useColor(os.Stdout)` (package-level switch, set once at startup) |
| go | lipgloss/termenv | set the renderer's color profile from the decision |
| rust | anstream / anstyle | `anstream::AutoStream::new(io::stdout(), choice)` with `ColorChoice::Never/Always/Auto` from the flag; auto mode reads `NO_COLOR`, `CLICOLOR`, `CLICOLOR_FORCE` |
| rust | clap help | `#[command(color = clap::ColorChoice::Auto)]`, or pass the flag value at runtime |

2. Windows: modern Windows terminals support ANSI only when virtual terminal processing is on for the console.

| Stack | Windows ANSI |
|---|---|
| python | `colorama.just_fix_windows_console()` (colorama 0.4.6+) at startup, or rich, which handles it |
| node | handled by Node for TTY streams |
| go | fatih/color uses `go-colorable` on Windows |
| rust | anstream handles Windows consoles |

3. Apply the same decision to stderr diagnostics (errors in red) using the stderr stream.

### Output
Library wired to `use_color`.

### Quality Gate
- `grep` for raw escapes outside the policy module returns nothing: `grep -rn '\\033\|\\x1b\|\\u001b' src/` lists only the policy or style module.

---

## Phase 3: Prove It with Bytes

### Entry Criteria
- Library wired.

### Actions
1. Run each case and count escape bytes (ESC is `\x1b`):

| Case | Command | Expect ESC count |
|---|---|---|
| piped, default | `RUN stats big.log | grep -c $'\x1b'` | 0 |
| piped, forced | `RUN --color=always stats big.log | grep -c $'\x1b'` | above 0 |
| NO_COLOR on a TTY | `NO_COLOR=1 script -q -c "RUN stats big.log" /dev/null | grep -c $'\x1b'` | 0 |
| TTY default | `script -q -c "RUN stats big.log" /dev/null | grep -c $'\x1b'` | above 0 |
| flag beats env | `NO_COLOR=1 RUN --color=always stats big.log | grep -c $'\x1b'` | above 0 |
| stderr piped, stdout TTY | `script -q -c "RUN stats nope.log 2>err.txt" /dev/null; grep -c $'\x1b' err.txt` | 0 |

2. `script -q -c CMD /dev/null` is the util-linux form (Linux). On macOS use `script -q /dev/null CMD`. Alternative: `unbuffer CMD` from the `expect` package.
3. `grep -c` exits 1 when the count is 0; read the printed number, not the exit status.
4. Record each failing case in `tty_findings`, fix, rerun all 6.

### Output
`color_policy`, `tty_findings`.

### Quality Gate
- All 6 cases print the expected count.
- `tty_findings` lists each fix with the case that proved it.

---

## Do Not

- Do not decide color from stdout's TTY state when writing to stderr.
- Do not treat `NO_COLOR=` (empty) as set; the standard says set and non-empty.
- Do not invent environment variable names. Only the variables in the Phase 1 table are defined by published conventions.

---

## Worked Example

Illustrative. Python tool printing level names with click.style through `print()`:
```
$ python -m logtrim stats big.log | grep -c $'\x1b'
200000
```
Finding: `print(click.style(...))` bypasses click's stripping. Fix: `click.echo(styled, color=use_color(sys.stdout))`.
```
$ python -m logtrim stats big.log | grep -c $'\x1b'
0
$ script -q -c "python -m logtrim stats big.log" /dev/null | grep -c $'\x1b'
200000
```

---

## Exit Criteria

DONE when one function decides color per stream with the 7-row precedence, the library obeys it, Windows consoles render it, and all 6 byte checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Library ignores the explicit choice | **Adjust**: strip styles yourself when `use_color` is false, and record the library version in `tty_findings`. |
| Phase 3 | `script` not installed | **Adjust**: use `unbuffer`, or a pty in the test harness (`pty` module in Python, `creack/pty` in Go). |
| Phase 3 | Colors appear in CI logs | **Return**: confirm whether CI sets `FORCE_COLOR`; that is expected per row 4. |
| Phase 3 | Windows shows raw `\x1b[` text | **Adjust**: enable virtual terminal processing per the Phase 2 table. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
