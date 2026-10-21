# CLI Progress Output

**One-line description:** Adds progress bars or spinners that draw only on a stderr TTY, stay silent under `--quiet`, pipes and CI, never corrupt stdout or interleave with log lines, and restore the cursor on Ctrl-C, using `tqdm`/`rich.progress`, `ora`/`cli-progress`, `schollz/progressbar`/`mpb`, or `indicatif`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stream_contract` (object, required): Confirms progress belongs on stderr.
- `color_policy` (object, required): The `use_color` decision function and TTY test.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `progress_policy` (object): When progress shows, which library, the stream, and the non-TTY fallback.
- `progress_findings` (object[]): Each probe result and fix.

---

## Phase 1: Decide When Progress Shows

### Entry Criteria
- `stream_contract` puts progress on stderr.

### Actions
1. Apply this rule table, first match wins:

| Condition | Show |
|---|---|
| `--quiet` given | nothing |
| stderr is not a TTY | nothing, or a plain one-line summary at the end if `cli_spec` wants it |
| `TERM` == `dumb` | nothing |
| total known | bar with count and rate |
| total unknown | spinner with count so far |

2. Pick the library by stack and kind:

| Stack | Bar | Spinner | Default stream |
|---|---|---|---|
| python | `tqdm` | `rich.progress` with `SpinnerColumn` | tqdm writes to stderr by default; rich needs `Console(stderr=True)` |
| node | `cli-progress` | `ora` | ora uses `process.stderr` by default; check `cli-progress` `stream` option in its README |
| go | `github.com/schollz/progressbar/v3` | same library, total `-1` | set `progressbar.OptionSetWriter(os.Stderr)` |
| go (several bars) | `github.com/vbauerster/mpb/v8` | | `mpb.WithOutput(os.Stderr)` |
| rust | `indicatif::ProgressBar::new(n)` | `ProgressBar::new_spinner()` | draws to stderr by default and hides when stderr is not a terminal |

3. Do not add a time or count threshold for showing progress unless the user supplies one; library default redraw rates are fine.

### Output
Draft `progress_policy`.

### Quality Gate
- The policy names the library, the stream (stderr), and the behavior for each row of the rule table.

---

## Phase 2: Implement

### Entry Criteria
- Policy drafted.

### Actions
1. Create the bar through one helper that applies the rule table, for example `make_progress(total)`, returning a no-op object when progress is off.
2. Per stack:
```python
# python, tqdm
from tqdm import tqdm
bar = tqdm(total=n, unit="line", disable=None if not quiet else True)  # disable=None: off when not a TTY
for line in lines:
    ...
    bar.update(1)
bar.close()
# log lines while the bar is active:
tqdm.write("skipped bad line 12", file=sys.stderr)
```
```js
// node, ora
import ora from 'ora';
const spinner = ora({ text: 'reading', stream: process.stderr, isEnabled: !quiet && process.stderr.isTTY === true }).start();
spinner.succeed('done'); // or spinner.fail('message')
```
```go
// go, schollz/progressbar
bar := progressbar.NewOptions64(total,
    progressbar.OptionSetWriter(os.Stderr),
    progressbar.OptionSetVisibility(!quiet && term.IsTerminal(int(os.Stderr.Fd()))),
)
_ = bar.Add(1)
_ = bar.Finish()
```
```rust
// rust, indicatif
let pb = if quiet { ProgressBar::hidden() } else { ProgressBar::new(total) };
pb.inc(1);
pb.println("skipped bad line 12");   // prints above the bar
pb.finish_and_clear();
```
3. Print log lines through the library while a bar is active (`tqdm.write`, `pb.println`, `spinner.clear()` then print then `spinner.render()`, mpb's bar-aware writer). A raw print leaves half-drawn bars in the log.
4. On SIGINT, stop the bar and restore the cursor before exiting (`bar.close()`, `spinner.stop()`, `pb.abandon()`). ora hides the cursor while spinning; an exit without `stop()` leaves it hidden. Coordinate with `cli-signal-sigint-handling`.
5. Confirm option names in the installed library's docs before using them (for example `python -c "import tqdm, inspect; print(inspect.signature(tqdm.tqdm.__init__))"`). Do not guess.

### Output
Progress helper wired into long operations.

### Quality Gate
- `grep` shows no progress library constructed outside the helper.

---

## Phase 3: Probe

### Entry Criteria
- Helper wired.

### Actions
1. Run and record:

| Case | Command | Pass when |
|---|---|---|
| piped stderr | `RUN trim --older-than 1d big.log >out.txt 2>err.txt` | `grep -c $'\r' err.txt` prints 0 and `grep -c $'\x1b' err.txt` prints 0 |
| stdout clean | same run | `out.txt` contains only result lines |
| TTY | `script -q -c "RUN trim --older-than 1d big.log >/dev/null" /dev/null` | the bar renders (read the captured output) |
| quiet on TTY | `script -q -c "RUN -q trim --older-than 1d big.log >/dev/null" /dev/null` | no bar characters |
| Ctrl-C on TTY | run interactively, press Ctrl-C mid-bar, then type `echo ok` | cursor visible, prompt on a fresh line |

2. Record failures in `progress_findings`, fix one at a time, rerun all cases.

### Output
`progress_policy`, `progress_findings`.

### Quality Gate
- The two `grep -c` checks print 0 for the piped case.
- The quiet case shows no bar.

---

## Do Not

- Do not draw progress on stdout.
- Do not print progress as a new line per item in non-TTY mode; it floods CI logs.
- Do not remove the `--quiet` check to "simplify".

---

## Worked Example

Illustrative. Python tool using `tqdm(..., file=sys.stdout)`:
```
$ python -m logtrim trim --older-than 1d big.log > out.txt
$ grep -c $'\r' out.txt
37
```
Finding: bar on stdout. Fix: remove `file=sys.stdout`, add `disable=None`.
```
$ python -m logtrim trim --older-than 1d big.log >out.txt 2>err.txt; grep -c $'\r' out.txt err.txt
out.txt:0
err.txt:0
```

---

## Exit Criteria

DONE when progress appears only on a stderr TTY without `--quiet`, log lines print cleanly above it, Ctrl-C restores the terminal, and the probe table passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No long-running operation exists | **Return**: record that the tool needs no progress output; emit an empty policy. |
| Phase 2 | Library has no way to disable on non-TTY | **Adjust**: return the no-op object from the helper based on the TTY test. |
| Phase 3 | `\r` bytes in piped stderr | **Retry**: the TTY check is missing or tests stdout; test stderr. |
| Phase 3 | Cursor hidden after Ctrl-C | **Adjust**: stop the spinner in the SIGINT path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
