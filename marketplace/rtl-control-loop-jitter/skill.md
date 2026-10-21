# Measure Control Loop Jitter

**One-line description:** Instruments the real control loop to record wakeup lateness, execution time and deadline overruns into a preallocated buffer over a timed run, writes trace markers for correlation, and judges the result against the user's jitter budget and against the cyclictest result for the same CPUs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_command` (string, required): Command that starts the instrumented control process.
- `loop_period_us` (integer, required): Loop period in microseconds.
- `jitter_budget_us` (integer, required): Largest wakeup lateness the user's control design tolerates, in microseconds. User-supplied; never chosen here.
- `test_duration` (string, required): Run length, for example `1h`.
- `latency_findings` (object, optional): From `rtl-cyclictest-histogram-read` for the same CPUs and load. Used to tell system latency from application latency.

---

## Outputs

- `jitter_report` (object): Sample count, lateness min, median, p99, p99.9 and max, execution time min, median and max, overrun count, a histogram file with 1 us buckets, the load conditions, and the comparison with `latency_findings`.
- `jitter_verdict` (string): `PASS` or `FAIL` by the rule in Phase 3, with the deciding numbers.

---

## Phase 1: Instrument The Loop

### Entry Criteria
- If the process commands motion, steering, braking, throttle or any actuator: the run happens only on a bench or a closed course, behind an independent hardware emergency stop that cuts actuator power without software. Braking and emergency-stop paths are never gated, delayed or blocked by the loop or this instrumentation. For vehicle work, prefer running with actuator outputs disabled and inputs replayed from a recorded log.
- The loop already uses absolute deadlines (`rtl-c-abs-deadline-loop`, `rtl-rust-rt-loop` or `rtl-py-rt-loop`).

### Actions
1. Add, in the loop's language, a preallocated array of N records (N = expected iterations for `test_duration`, computed as duration / period, or a ring of fixed size with min/max kept separately). Each record: `lateness_ns` = time read right after the sleep returns minus the absolute deadline it slept until; `exec_ns` = time at end of work minus time after wake.
2. Use `CLOCK_MONOTONIC` for both reads. Do not print, log or allocate inside the loop to do this.
3. Count an overrun when end-of-work time is at or after the next deadline.
4. Optional correlation with kernel traces: open `/sys/kernel/tracing/trace_marker` once at startup and, only when lateness exceeds `jitter_budget_us`, `write()` a short fixed string such as `LATE` to it. One write syscall per exceeding iteration is acceptable for diagnosis; remove or gate it for production.
5. After the run, write the array to a file from a non-RT context (at exit or from a separate thread reading a completed buffer).
6. Build and run the project tests; they must pass (exit 0) with the instrumentation compiled in.

### Output
Instrumented binary.

### Quality Gate
- Tests exit 0; no test removed or weakened.
- A grep of the loop body shows no print, log or allocation call added.

---

## Phase 2: Run Under Realistic Load

### Entry Criteria
- Phase 1 complete. System tuning in place (isolation, IRQ affinity, power) as it will be in use.

### Actions
1. Start the same housekeeping load as `rtl-cyclictest-under-load` (record commands), plus the real input traffic the loop handles (for CAN, replay a recorded log with `canplayer -I <log> vcan0=can0` or similar onto a test bus; read-only on a real vehicle bus).
2. Start the process with `app_command` and run for `test_duration`.
3. Collect the output file. Check sample count equals expected iterations; a lower count means the run ended early.

### Output
Raw lateness and execution samples.

### Quality Gate
- Sample count is recorded next to the expected count (duration / period).

---

## Phase 3: Analyze And Judge

### Entry Criteria
- Samples file exists.

### Actions
1. Compute lateness min, median, p99, p99.9, max (in us); execution time min, median, max; overrun count. Use any tool (`python3 -c`, `awk`, a notebook); record the exact command.
2. Build a 1 us histogram of lateness, same format as cyclictest, so the two can be plotted together (`rtl-cyclictest-histogram-read` Phase 3 gnuplot command).
3. Verdict rule:
   - `PASS` if max lateness < `jitter_budget_us` and overrun count = 0, over the stated sample count.
   - `FAIL` otherwise.
   State that a PASS is the worst case observed in this run, not a proven bound.
4. Compare with `latency_findings` for the same CPU:

| Comparison | Where to look |
|---|---|
| App max lateness <= cyclictest max under the same load | System latency dominates; tracing flows (`rtl-rtla-timerlat`, `rtl-ftrace-latency-trace`) |
| App max lateness > cyclictest max under the same load | The application adds delay to its own wakeup: page faults, locks, syscalls before the sleep, other threads at equal priority. Check `rtl-c-mlockall-prefault`, `rtl-c-pi-mutex`, `rtl-timer-slack` |
| Overruns > 0 while max lateness < `jitter_budget_us` | Execution time exceeds the period; the work itself is too long |
| `latency_findings` absent | Report raw numbers only; run `rtl-cyclictest-under-load` for a comparison |

   Report both maxima as raw numbers next to the row chosen.
5. On `FAIL`, the chain may loop to `rtl-rtla-timerlat` with this `jitter_report`; limit to the configured number of loops.

### Output
`jitter_report`, `jitter_verdict`.

### Quality Gate
- Every statistic is computed from the samples file by a recorded command.
- `jitter_verdict` follows the rule in step 3, with max lateness, budget and overrun count quoted.

---

## Worked Example

Illustrative. Steering-angle filter on a bench rig with hardware e-stop, actuator outputs disabled, CAN replayed from a log. `loop_period_us` = 1000, `jitter_budget_us` = 100 (from the user's control design), `test_duration` = `1h`.

```
expected 3600000  samples 3600000
lateness us: min 2  median 4  p99 9  p99.9 13  max 71
exec us:     min 180  median 210  max 388
overruns: 0
cyclictest same CPU, same load: max 16 us
```
`jitter_verdict` = `PASS` (71 < 100, 0 overruns, 3600000 samples). The app max (71 us) is above the cyclictest max (16 us), so the user is shown the second comparison row: an application-side delay exists below budget. A trace with `trace_marker` writes at a temporary 50 us threshold showed the late wakeups follow a `can_logger` thread at the same priority; the user lowers that thread's priority.

---

## Exit Criteria

DONE when the loop's own lateness, execution time and overruns are measured over the full duration under recorded load, a PASS or FAIL verdict is computed by rule, and the comparison with cyclictest points to the next step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No hardware e-stop for an actuator-commanding run | **Stop**: run with actuator outputs disabled or not at all. |
| Phase 1 | Loop uses relative sleeps | **Return**: run the stack's loop flow first; lateness against a relative sleep is not meaningful. |
| Phase 2 | Sample count below expected | **Retry**: find why the run ended (crash, kill) and rerun. |
| Phase 3 | `jitter_budget_us` not supplied | **Return**: ask the user; report statistics without a verdict. |
| Phase 3 | `FAIL` | **Return**: pass `jitter_report` to `rtl-rtla-timerlat`; do not widen the budget to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
