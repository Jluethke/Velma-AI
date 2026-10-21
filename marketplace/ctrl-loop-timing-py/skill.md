# Python Control Loop Timing And Jitter

**One-line description:** Measures period jitter, compute time and deadline misses of the Python control loop on the target computer under load with `time.monotonic_ns` timestamps, tests the effect of SCHED_FIFO, CPU affinity and garbage collector control, and reports percentiles against the controller period.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_controller_build` (object, required): From `ctrl-impl-py`.
- `control_spec` (object, required): Supplies controller period and the user's maximum acceptable jitter and compute budget.

---

## Outputs

- `py_timing_report` (object): Histogram and percentiles (p50, p99, p99.9, max) of period error and compute time per configuration, deadline miss counts, kernel and Python versions, scheduling settings, and a PASS or FAIL against the user's budget.

---

## Phase 1: Record The Platform

### Entry Criteria
- The package runs on the target computer with the simulator adapter.

### Actions
1. Record `uname -a`, `python3 --version`, CPU model (`lscpu`), and whether the kernel is PREEMPT_RT (`uname -v` contains `PREEMPT_RT`, or `cat /sys/kernel/realtime` prints 1 on RT kernels that expose it).
2. Record CPU frequency governor: `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`.
3. Baseline platform latency with `cyclictest` (package `rt-tests`): `sudo cyclictest --mlockall --smp --priority=<p> --interval=<period_us> --distance=0 --duration=<d>` with values the user chooses. Record the Max column. Python cannot do better than this floor.

### Output
Platform record and cyclictest baseline.

### Quality Gate
- cyclictest output with Min, Avg, Max per CPU is saved to a file.

---

## Phase 2: Measure Configurations

### Entry Criteria
- Baseline recorded.

### Actions
1. Use the loop's own per-cycle log (wake time, compute start, compute end). Period error `= wake_k - (t0 + k * period)`; compute time `= end_k - start_k`.
2. Run each configuration for the same duration with the simulator adapter and a background load the user specifies (for example `stress-ng --cpu <n> --io <n> --timeout <d>`; check `stress-ng --help` for options):
   - C1 default scheduler.
   - C2 `os.sched_setaffinity(0, {cpu})` on an isolated core (boot parameter `isolcpus=` if the user configured it).
   - C3 C2 plus `os.sched_setscheduler(0, os.SCHED_FIFO, os.sched_param(p))` (requires root or `CAP_SYS_NICE`; or launch with `chrt -f <p>`).
   - C4 C3 plus `gc.freeze(); gc.disable()` while engaged.
3. Lock memory if the user's runtime allows: Python has no `mlockall` in the standard library; use `ctypes.CDLL("libc.so.6").mlockall(3)` (MCL_CURRENT | MCL_FUTURE = 3 on Linux) and check its return value is 0.

### Output
Per-configuration timing logs.

### Quality Gate
- Four logs exist with the same duration and the same cycle count (printed).

---

## Phase 3: Report And Judge

### Entry Criteria
- Logs complete.

### Actions
1. Compute `numpy.percentile(x, [50, 99, 99.9])` and max for period error and compute time per configuration. Count deadline misses (end time past the next deadline).
2. Plot histograms on a log y axis (`matplotlib`, `plt.yscale("log")`); tails matter, not averages.
3. Judge against the user's jitter and compute budgets. Max is the judged value, not p99. If no budget is given, report and mark "not judged".
4. Decision: if the best configuration fails, the Python runtime is not suitable at this period. Return with the recommendation to use the C++ build (`ctrl-impl-cpp`) or a longer period that the stability report still supports.

### Output
`py_timing_report`.

### Quality Gate
- Report table lists all four configurations with max values and miss counts.

---

## Worked Example

Illustrative only. 20 ms period, 30 min per configuration, PREEMPT_RT kernel, cyclictest max 38 us.

- Phase 2: C1 max period error 9.7 ms, 41 misses; C4 max 0.61 ms, 0 misses.
- Phase 3: user budget 2 ms jitter, 10 ms compute: C4 PASS.

---

## Exit Criteria

DONE when every configuration is measured for equal duration under load and the best one is judged against the user's budgets using the maximum.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | cyclictest not installed | **Adjust**: install `rt-tests` from the distribution; rerun. |
| Phase 2 | `PermissionError` on SCHED_FIFO | **Adjust**: run with `CAP_SYS_NICE` or `chrt`; record. |
| Phase 3 | All configurations fail | **Return**: recommend the C++ build or a longer period. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
