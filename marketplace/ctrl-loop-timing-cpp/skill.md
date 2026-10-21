# C++ Control Loop Timing On Linux

**One-line description:** Implements and measures the C++ control loop on Linux with `clock_nanosleep` absolute deadlines on CLOCK_MONOTONIC, SCHED_FIFO, `mlockall` and CPU pinning, compares it with the cyclictest platform floor under load, and reports jitter and deadline misses against the controller period.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_controller_build` (object, required): From `ctrl-impl-cpp`.
- `control_spec` (object, required): Supplies controller period and the user's jitter and compute budgets.

---

## Outputs

- `cpp_timing_report` (object): Platform record, cyclictest baseline, loop period error and compute time percentiles and maximum, deadline miss count, configuration (priority, CPU, memory locking), and PASS or FAIL against the user's budgets.

---

## Phase 1: Loop Implementation

### Entry Criteria
- Release build exists.

### Actions
1. Startup sequence in `main`, before entering the loop:
   - `mlockall(MCL_CURRENT | MCL_FUTURE)`; check the return value is 0, else log `errno`.
   - Prefault the stack (touch a fixed-size local array once).
   - Pin: `pthread_setaffinity_np` with a `cpu_set_t` for the user's chosen core.
   - Priority: `pthread_setschedparam(pthread_self(), SCHED_FIFO, &param)` with the user's priority; check the return code.
2. Loop with absolute deadlines: `clock_gettime(CLOCK_MONOTONIC, &next)`; each cycle add the period with nanosecond carry, then `clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, nullptr)`. Never use relative sleep (`usleep`, `std::this_thread::sleep_for`) for the period.
3. Timestamps per cycle (wake, compute start, compute end) go into a preallocated ring buffer; a lower-priority thread writes it to disk.
4. Overrun rule: if compute end passes the next deadline, count a miss and advance `next` by whole periods to the next future deadline; do not run catch-up cycles back to back.

### Output
Loop source with the startup sequence.

### Quality Gate
- The startup log prints the return code of `mlockall`, `pthread_setaffinity_np` and `pthread_setschedparam`, and each is 0.
- `chrt -p <pid>` prints `SCHED_FIFO` and the configured priority while the loop runs.

---

## Phase 2: Platform Floor

### Entry Criteria
- Loop builds.

### Actions
1. Record `uname -a`, `lscpu`, PREEMPT_RT status (`uname -v`), and kernel command line (`cat /proc/cmdline`) for `isolcpus`, `nohz_full`, `rcu_nocbs`.
2. Run `sudo cyclictest --mlockall --smp --priority=<p> --interval=<period_us> --distance=0 --duration=<d> --histogram=<max_us> --histfile=cyclictest_hist.txt` under the same background load the user specifies for the loop test (for example `stress-ng`). Check option spellings with `cyclictest --help` for your rt-tests version.
3. Save the Max per CPU.

### Output
cyclictest baseline.

### Quality Gate
- `cyclictest_hist.txt` exists and contains the Max latencies line.

---

## Phase 3: Loop Measurement

### Entry Criteria
- Baseline recorded.

### Actions
1. Run the controller with the simulator input adapter for the same duration and load as cyclictest.
2. Compute period error and compute time percentiles (p50, p99, p99.9, max) and deadline misses from the ring buffer log.
3. Check the loop's max period error against the cyclictest max for the pinned CPU. A loop error much larger than the floor points to work inside the loop (allocation, logging, page faults). Check page faults with `perf stat -e page-faults,major-faults -p <pid>` during the run.
4. Judge max values against the user's budgets. No budget means "not judged".

### Output
`cpp_timing_report`.

### Quality Gate
- Report lists max period error, max compute time, miss count, and page faults during the engaged run.
- Major page faults during the measured window is 0, or the report flags it.

---

## Worked Example

Illustrative only. 10 ms period, CPU 3 isolated, priority 80 chosen by the user, 1 h under `stress-ng --cpu 4 --io 2`.

- Phase 2: cyclictest Max on CPU 3: 27 us.
- Phase 3: loop period error max 41 us, compute max 0.38 ms, 0 misses, 0 major faults. User budget 200 us jitter: PASS.

---

## Exit Criteria

DONE when the loop uses absolute deadlines with locked memory and real-time scheduling, and its measured maximum jitter and misses are reported against the platform floor and the user's budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pthread_setschedparam` returns EPERM | **Adjust**: grant `CAP_SYS_NICE` or set `rtprio` in `/etc/security/limits.conf`; rerun. |
| Phase 3 | Loop jitter far above cyclictest floor | **Adjust**: remove allocation and I/O from the loop; re-measure. |
| Phase 3 | Misses persist at the platform floor | **Return**: recommend an RT kernel or a longer period that the stability report supports. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
