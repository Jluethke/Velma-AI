# Split Latency With rtla timerlat

**One-line description:** Uses `rtla timerlat top`, `rtla timerlat hist` and timerlat auto analysis to split timer wakeup latency on the real-time CPUs into IRQ latency and thread latency, and to name the interrupt, softirq or thread that delayed the worst wakeup.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `latency_findings` (object, optional): From `rtl-cyclictest-histogram-read` (or a `jitter_report` on a retry loop). Gives the worst CPU to focus on. When absent, measure all `rt_cpus`.
- `rt_cpus` (string, required): CPUs to measure.
- `jitter_budget_us` (integer, required): User's latency budget, used as the stop threshold for auto analysis.

---

## Outputs

- `timerlat_report` (object): Per CPU IRQ and thread latency min, avg, max; the auto analysis text for the worst event (IRQ handler delay, blocking thread, interference list with durations); the trace file path; and a named cause category.

---

## Phase 1: Check rtla And Kernel Support

### Entry Criteria
- `kernel_report.config.CONFIG_TIMERLAT_TRACER` is `y` (see `rtl-kernel-rt-check`).

### Actions
1. `rtla --help` and `rtla timerlat --help`. Install the `rtla` package if missing, or build from `tools/tracing/rtla` of the kernel source matching `uname -r` (`make && sudo make install`).
2. Read `rtla timerlat top --help` and confirm these options exist in your version: `-c/--cpus`, `-d/--duration`, `-P/--priority`, `-a/--auto`, `-T/--thread`, `-i/--irq`, `-t/--trace`, `-q/--quiet`. Older versions lack `--auto`; then use `-T` and `-t`.
3. Stop other tracing users first: `cat /sys/kernel/tracing/current_tracer` should print `nop`.

### Output
Confirmed tool version and options.

### Quality Gate
- `rtla --version` (or the package version) is recorded, and every option used later appears in `--help`.

---

## Phase 2: Measure IRQ And Thread Latency

### Entry Criteria
- Phase 1 complete. If your production loop is running, run rtla on the same CPUs only with the user's agreement: the timerlat thread competes with the loop at the priority you give it.

### Actions
1. Run a summary: `sudo rtla timerlat top -c <rt_cpus> -d <duration> -P f:<priority>`. `-P f:N` sets the measuring thread to SCHED_FIFO priority N; use the control loop's priority so the numbers match.
2. Read columns: for each CPU, `IRQ Timer Latency` (cur, min, avg, max) is the time from the timer's expiry to the timer IRQ handler running; `Thread Timer Latency` is the time until the timerlat thread itself runs. The difference between them is time spent after the IRQ before the thread was scheduled.
3. Run a distribution: `sudo rtla timerlat hist -c <rt_cpus> -d <duration> -P f:<priority>`. Output has `Index` (microseconds), per CPU IRQ and Thread counts, and `over:`, `count:`, `min:`, `avg:`, `max:` rows.
4. Interpret with this table:

| Pattern | Points at |
|---|---|
| IRQ max high | Interrupts disabled for long stretches, another hard IRQ, SMI or NMI, idle state exit |
| IRQ max low, Thread max high | A higher or equal priority thread, a preemption-disabled region, or a lock |
| Both high only on one CPU | Something specific to that CPU: an unmoved IRQ, a pinned kernel thread |

### Output
Per CPU IRQ and thread statistics.

### Quality Gate
- Per CPU IRQ max and Thread max are copied from the tool output for each CPU in `rt_cpus`.

---

## Phase 3: Auto Analysis Of The Worst Event

### Entry Criteria
- Phase 2 complete.

### Actions
1. Run with a stop threshold equal to the budget: `sudo rtla timerlat top -c <cpu> -P f:<priority> -a <jitter_budget_us>`. When a thread latency at or above the threshold occurs, tracing stops and rtla prints an analysis and saves `timerlat_trace.txt`.
2. Read the analysis blocks:
   - `IRQ handler delay`: time before the timer IRQ handler ran. A large value with `(exit from idle)` means C-state exit; go to `rtl-power-cstate-tuning`.
   - `IRQ latency`: total IRQ latency.
   - `Blocking thread`: the thread that was running when the timerlat thread should have run, with PID and name.
   - `IRQ interference`, `Softirq interference`, `Thread interference`: each item with its duration.
3. Name the cause category from the largest item: `idle_exit`, `irq:<name>`, `softirq:<name>`, `thread:<name>`, `hardware_or_firmware` (latency with nothing listed; compare with `rtl-hw-noise-check`).
4. Keep `timerlat_trace.txt`; `rtl-ftrace-latency-trace` can use it.

### Output
`timerlat_report`.

### Quality Gate
- The auto analysis text is saved verbatim, or the run is recorded as `threshold not hit in <duration>`.
- The cause category is named from the largest listed item, with its duration.

---

## Worked Example

Illustrative. `rt_cpus` = `3`, `jitter_budget_us` = 50, loop priority 80.

```
$ sudo rtla timerlat top -c 3 -P f:80 -a 50
  Timer Latency
  0 00:01:12   |          IRQ Timer Latency (us)        |         Thread Timer Latency (us)
CPU COUNT      |      cur       min       avg       max |      cur       min       avg       max
  3 #71988     |        1         0         1        41 |       52         2         3        52
rtla timerlat hit stop tracing
## CPU 3 hit stop tracing, analyzing it ##
  IRQ handler delay:                                    37.12 us (71.38 %)
  IRQ latency:                                          41.04 us
  Timerlat IRQ duration:                                 2.11 us (4.06 %)
  Blocking thread:                                       6.40 us (12.31 %)
                     nvme0q3:0                           6.40 us
  ...
  Thread latency:                                       52.00 us (100%)
```
Largest item: IRQ handler delay, no `exit from idle` marker. Cause category `irq:nvme0q3` region; matches the managed NVMe IRQ left on CPU 3 by `rtl-irq-affinity`.

---

## Exit Criteria

DONE when per CPU IRQ and thread latencies are recorded, and either the worst event above the budget has a named cause with durations, or the run is recorded as not reaching the budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `timerlat` tracer not available | **Return**: kernel lacks `CONFIG_TIMERLAT_TRACER`; use `rtl-ftrace-latency-trace` instead. |
| Phase 1 | `--auto` not recognized | **Adjust**: use `-T <budget> -t` to stop and save the trace, then read it manually. |
| Phase 2 | Tracer busy | **Adjust**: `echo nop | sudo tee /sys/kernel/tracing/current_tracer` after confirming no one else is tracing. |
| Phase 3 | Threshold never hit | **Return**: report `not hit` with duration; the spike may need load (rerun under `rtl-cyclictest-under-load` conditions). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
