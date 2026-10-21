# Read A Cyclictest Histogram

**One-line description:** Parses a cyclictest histogram file into per-CPU minimum, average, maximum, overflow count and tail counts above the user's latency budget, plots it on a log scale, and reports whether any CPU exceeded the budget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cyclictest_histogram` (string, required): Path to a file written with cyclictest `--histogram=N` and `--histfile` (or captured stdout of an `-h` run), plus its command line if known.
- `jitter_budget_us` (integer, required): The largest wakeup latency the user's control loop tolerates, in microseconds. It comes from the user's control design. This flow never chooses it.

---

## Outputs

- `latency_findings` (object): Per CPU `min_us`, `avg_us`, `max_us`, `overflows`, `samples`, `count_above_budget`, and the overflow cycle numbers if present; `exceeds_budget` (true if any CPU's max or overflow is at or above the budget); `worst_cpu`; `plot_path`; the source file path.

---

## Phase 1: Parse The File

### Entry Criteria
- The file exists and contains a line starting `# Max Latencies`.

### Actions
1. Understand the format. Body lines are `<bucket_us> <count_cpu0> <count_cpu1> ...`, one line per 1 us bucket from 0 to N-1 (bucket `000023` holds wakeups that took 23 us). Footer lines start with `#`:
   - `# Total:` samples per thread.
   - `# Min Latencies:`, `# Avg Latencies:`, `# Max Latencies:` per thread.
   - `# Histogram Overflows:` count of samples at or above N per thread.
   - `# Histogram Overflow at cycle number:` the loop counts where overflows happened (present in recent versions).
2. Read the footer with `grep '^#' <file>`. Record values per column.
3. Map columns to CPUs: with `--smp` or `-a` plus `-t`, column k is thread k; read the command line to map thread to CPU. If the command line is unknown, report columns as threads, not CPUs.
4. Sum body counts above the budget per column: `awk -v b=<jitter_budget_us> '!/^#/ && $1+0 >= b { for (i=2;i<=NF;i++) s[i]+=$i } END { for (i in s) print i-1, s[i] }' <file>`. Add the overflow count, because overflows are above N and therefore above any budget below N.

### Output
Per-column statistics and above-budget counts.

### Quality Gate
- `samples` per column equals the `# Total:` value.
- `max_us` per column equals the `# Max Latencies:` value.

---

## Phase 2: Judge Against Budget

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each column apply:

| Condition | Verdict |
|---|---|
| `overflows` > 0 and N <= `jitter_budget_us` | Unknown max; rerun with `-h` larger than the budget |
| `overflows` > 0 and N > `jitter_budget_us` | Exceeds budget |
| `max_us` >= `jitter_budget_us` | Exceeds budget |
| `max_us` < `jitter_budget_us` and `overflows` = 0 | Within budget for this run |

2. Set `exceeds_budget` true if any column is "Exceeds budget". Set `worst_cpu` to the column with the highest `max_us`.
3. Do not report the average as the result; real-time requirements are about the maximum. A low average with a high maximum is a failure for a hard deadline.
4. Note the limit of the evidence: a maximum from a finite run is the worst case seen, not a bound. State the sample count next to every maximum.

### Output
Verdict per column and `exceeds_budget`.

### Quality Gate
- Every column has a verdict from a table row.
- Every reported maximum is shown with its sample count.

---

## Phase 3: Plot

### Entry Criteria
- Phase 2 complete.

### Actions
1. Plot counts on a log y axis, because the tail holds single-digit counts next to millions in the mode. With gnuplot:
   `gnuplot -e "set terminal png size 1000,600; set output 'hist.png'; set logscale y; set xlabel 'latency (us)'; set ylabel 'samples'; plot for [c=2:<cols+1>] '<file>' using 1:c with steps title sprintf('thread %d', c-2)"`
   gnuplot skips `#` lines by default.
2. Draw the budget as a vertical line (`set arrow from <budget>,graph 0 to <budget>,graph 1 nohead`) before `plot`.
3. Read the plot: a single narrow peak with a clean tail is typical of a tuned CPU; a second hump or a long flat tail points to a periodic disturbance (another timer, a periodic IRQ, SMIs) that tracing must identify.

### Output
`plot_path`, completed `latency_findings`.

### Quality Gate
- `hist.png` exists and is non-empty (`test -s hist.png && echo ok`).

---

## Worked Example

Illustrative. `jitter_budget_us` = 50, file from a 1 h run on CPUs 2-3, `-h 400`.

```
$ grep '^#' loaded_hist.txt
# Total: 003599999 003599999
# Min Latencies: 00002 00002
# Avg Latencies: 00003 00003
# Max Latencies: 00014 00063
# Histogram Overflows: 00000 00000
$ awk -v b=50 '!/^#/ && $1+0 >= b { for (i=2;i<=NF;i++) s[i]+=$i } END { for (i in s) print i-1, s[i] }' loaded_hist.txt
1 0
2 3
```
Thread 0 (CPU 2): max 14 us, within budget. Thread 1 (CPU 3): max 63 us, 3 samples at or above 50 us out of 3599999: exceeds budget. `exceeds_budget` = true, `worst_cpu` = 3. The plot shows a small second cluster at 55 to 63 us on CPU 3, passed to `rtl-ftrace-latency-trace`.

---

## Exit Criteria

DONE when every column has statistics matching the footer, an above-budget count, a table verdict, and the plot exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `#` footer | **Retry**: the run was cut short; rerun the measurement. |
| Phase 1 | Column count differs from thread count | **Return**: the file was not written by the command claimed; ask for the command line. |
| Phase 2 | `jitter_budget_us` not supplied | **Return**: ask the user; report statistics only. |
| Phase 3 | gnuplot missing | **Adjust**: install it, or report the table without a plot and set `plot_path` to none. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
