# Cyclictest Baseline

**One-line description:** Measures untuned timer wakeup latency on every CPU with cyclictest from rt-tests, with a histogram file saved, so every later tuning step has a recorded before value to beat.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kernel_report` (object, required): From `rtl-kernel-rt-check`. Supplies `cpus`, `preempt_rt` and `cmdline`.
- `test_duration` (string, required): Run length in cyclictest `-D` syntax, for example `10m` or `1h`. Chosen by the user. A rare spike only appears in a long enough run; this flow does not pick the length.
- `rt_priority` (integer, required): SCHED_FIFO priority, 1 to 98, that the control loop will run at. Cyclictest threads run at the same priority so the measurement matches the real loop.

---

## Outputs

- `baseline_histogram` (string): Path to the saved histogram file (`baseline_hist.txt`), plus the exact command line used.
- `baseline_summary` (object): Per CPU `min_us`, `avg_us`, `max_us`, `overflows`, and the run's `interval_us`, `duration`, `priority`, `kernel_release`, and whether the machine was idle or loaded.

---

## Phase 1: Prepare

### Entry Criteria
- `kernel_report` exists. If `preempt_rt` is false, the baseline is still valid as a before value; label it `non-RT kernel`.
- No control software is running that commands actuators. On a vehicle computer, run this on the bench or with the vehicle parked and all actuator outputs disabled; cyclictest at high priority can starve other tasks.

### Actions
1. Install rt-tests: `sudo apt install rt-tests` (Debian/Ubuntu) or `sudo dnf install rt-tests` (RHEL/Fedora). Confirm with `cyclictest --help 2>&1 | head -3`.
2. Read the flags supported by this build: `cyclictest --help`. Confirm these exist before using them: `--mlockall` (`-m`), `--smp` (`-S`), `--priority` (`-p`), `--interval` (`-i`), `--distance` (`-d`), `--duration` (`-D`), `--histogram` (`-h`), `--histfile`, `--quiet` (`-q`). Older builds may lack `--histfile`; in that case redirect stdout to the file.
3. Choose the histogram range. `-h N` buckets latencies from 0 to N-1 microseconds in 1 us steps; anything at or above N counts as an overflow. Set N above the worst value you expect so overflows stay 0; if the run reports overflows, re-run with a larger N rather than discarding them.
4. Choose `--interval`. Cyclictest's default interval is 1000 us. If the control loop period is known, use the same period in microseconds so the timer load matches.
5. Note: cyclictest by default opens `/dev/cpu_dma_latency` and writes 0, which prevents deep C-states while it runs. Your control application does not do this unless you add it. Record this; `rtl-power-cstate-tuning` uses it. Use `--laptop` to measure without that request if you want a number that matches an application without it.

### Output
Confirmed flags and chosen interval and histogram range.

### Quality Gate
- `cyclictest --help` output contains every flag used in Phase 2.
- The chosen `-h` value and `--interval` value are written down with their source (loop period or tool default).

---

## Phase 2: Run On An Idle System

### Entry Criteria
- Phase 1 complete.

### Actions
1. Run, as root:
   `sudo cyclictest --mlockall --smp --priority=<rt_priority> --interval=<interval_us> --distance=0 --duration=<test_duration> --histogram=<N> --histfile=baseline_hist.txt --quiet`
   `--smp` starts one thread per CPU pinned to that CPU. `--distance=0` gives all threads the same interval.
2. Do not run anything else heavy during this run; this is the idle baseline. Loaded runs belong to `rtl-cyclictest-under-load`.
3. When the run ends, confirm the file exists and is non-empty: `wc -l baseline_hist.txt`.

### Output
`baseline_hist.txt`.

### Quality Gate
- `grep -c '^# Max Latencies' baseline_hist.txt` prints 1.
- `grep '^# Histogram Overflows' baseline_hist.txt` line exists; record its values.

---

## Phase 3: Extract The Summary

### Entry Criteria
- Histogram file exists.

### Actions
1. Read the footer lines: `grep -E '^# (Total|Min Latencies|Avg Latencies|Max Latencies|Histogram Overflows)' baseline_hist.txt`. Each line has one column per CPU thread in thread order (thread 0 on CPU 0 with `--smp`).
2. Build `baseline_summary` with one entry per CPU: `min_us`, `avg_us`, `max_us`, `overflows`.
3. If any `overflows` value is nonzero, the true maximum is above `N`. Record `max_us` as `>= N` and re-run Phase 2 with a larger `N`.
4. Record the context: `interval_us`, `duration`, `priority`, `kernel_release`, `load: idle`.

### Output
`baseline_histogram`, `baseline_summary`.

### Quality Gate
- `baseline_summary` has an entry for every CPU in `kernel_report.cpus`.
- Every `max_us` equals the corresponding column of `# Max Latencies` in the file.

---

## Worked Example

Illustrative. 4 CPUs, `rt_priority` = 80, loop period 1000 us, `test_duration` = `10m`.

```
$ sudo cyclictest --mlockall --smp --priority=80 --interval=1000 --distance=0 \
    --duration=10m --histogram=400 --histfile=baseline_hist.txt --quiet
$ grep -E '^# (Min|Avg|Max) Latencies|^# Histogram Overflows' baseline_hist.txt
# Min Latencies: 00002 00002 00002 00002
# Avg Latencies: 00003 00003 00003 00003
# Max Latencies: 00041 00019 00023 00057
# Histogram Overflows: 00000 00000 00000 00000
```
`baseline_summary`: CPU0 max 41 us, CPU1 19, CPU2 23, CPU3 57, no overflows, `load: idle`, kernel `6.12.43+deb13-rt-amd64`.

---

## Exit Criteria

DONE when the histogram file is saved with its exact command line and every CPU has min, average, maximum and overflow values read from the file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cyclictest` not found after install | **Adjust**: build rt-tests from `git.kernel.org/pub/scm/utils/rt-tests/rt-tests.git` with `make`; record the version. |
| Phase 2 | `Unable to change scheduling policy` or permission error | **Adjust**: run with sudo, or see `rtl-sched-fifo-chrt` for rtprio limits. |
| Phase 2 | System becomes unresponsive | **Stop**: reboot, re-run with a shorter duration first. Do not raise priority to 99. |
| Phase 3 | Nonzero overflows | **Retry**: increase `-h` and repeat Phase 2. Never report a max that excludes overflows. |
| Phase 3 | Footer lines missing | **Retry**: the run was interrupted; re-run to completion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
