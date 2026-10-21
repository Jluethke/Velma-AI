# Python Control Loop Real-Time Setup

**One-line description:** Configures a Python control process for SCHED_FIFO and CPU affinity with `os.sched_setscheduler` and `os.sched_setaffinity`, locks memory through ctypes `mlockall`, controls the garbage collector with `gc.freeze` and `gc.disable`, sleeps on absolute deadlines through ctypes `clock_nanosleep`, and measures whether Python meets the user's budget before anyone relies on it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): Python project with its test command.
- `loop_period_us` (integer, required): Loop period in microseconds.
- `rt_priority` (integer, required): SCHED_FIFO priority for the process.

---

## Outputs

- `py_rt_patch` (object): The startup module changed, Python version, the setup code, test exit code, the measured lateness distribution with its maximum, and a recommendation from the decision table in Phase 3.

---

## Phase 1: Inspect

### Entry Criteria
- Tests pass before changes (record command and exit code, for example `python -m pytest`).

### Actions
1. `python3 --version`. Record it. `gc.freeze()` needs Python 3.7 or newer.
2. Find the loop: `grep -rn -E 'while True|time.sleep|asyncio.sleep|threading.Thread' <app_source_dir>`.
3. Know the limits before changing anything: the GIL means any other Python thread in the process can delay the loop thread; the cyclic garbage collector can pause at allocation points; the interpreter allocates on almost every operation. Python's standard library has no `clock_nanosleep`; `time.sleep` is a relative sleep.

### Output
Loop location and Python version.

### Quality Gate
- The loop's location is quoted with file and line.

---

## Phase 2: Add The Setup

### Entry Criteria
- Phase 1 complete. Edit only the startup module and the loop function.

### Actions
1. At startup, before creating other threads and before the loop:
   ```python
   import ctypes, gc, os, time
   libc = ctypes.CDLL("libc.so.6", use_errno=True)
   MCL_CURRENT, MCL_FUTURE = 1, 2            # values from <sys/mman.h> on Linux
   if libc.mlockall(MCL_CURRENT | MCL_FUTURE) != 0:
       raise OSError(ctypes.get_errno(), "mlockall")
   os.sched_setaffinity(0, RT_CPUS)          # set of ints, e.g. {2}
   os.sched_setscheduler(0, os.SCHED_FIFO, os.sched_param(RT_PRIO))
   gc.collect(); gc.freeze(); gc.disable()   # move existing objects out of GC tracking, stop automatic collection
   ```
   Confirm the `MCL_*` values on your platform with `grep -E 'MCL_(CURRENT|FUTURE)' /usr/include/*/bits/mman*.h` or the man page; they are architecture dependent on some platforms.
2. If `gc.disable()` is used, the program must not create reference cycles in the loop, or memory grows. Run `gc.collect()` only at a point the user designates as safe (not in the loop), or leave the collector enabled and measure.
3. Absolute sleep through ctypes:
   ```python
   class timespec(ctypes.Structure):
       _fields_ = [("tv_sec", ctypes.c_long), ("tv_nsec", ctypes.c_long)]
   CLOCK_MONOTONIC, TIMER_ABSTIME = 1, 1      # Linux values from <time.h>
   nxt = time.clock_gettime_ns(time.CLOCK_MONOTONIC)
   ts = timespec()
   while running:
       nxt += PERIOD_NS
       ts.tv_sec, ts.tv_nsec = divmod(nxt, 1_000_000_000)
       while (rc := libc.clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, ctypes.byref(ts), None)) == 4:  # EINTR
           pass
       step()
   ```
   Reuse the single `timespec` object; creating one per iteration allocates.
4. Keep logging, printing and network I/O out of the loop thread.

### Output
Patched startup and loop.

### Quality Gate
- The test suite exits 0 after the change; no test removed or weakened.

---

## Phase 3: Measure And Decide

### Entry Criteria
- Limits granted (rtprio, memlock).
- If the process commands actuators: bench or closed course only, behind an independent hardware emergency stop; braking and emergency stop are never dependent on this loop. Otherwise actuator outputs disabled.

### Actions
1. Record lateness each iteration into a preallocated `array.array('q', bytes(8 * N))` (index-assigned, not appended): lateness = `time.clock_gettime_ns(time.CLOCK_MONOTONIC) - nxt` right after the sleep returns.
2. Run for the user's duration under the same load as the system tests. Write the array to a file after the run.
3. Compute min, median, max, and count above `jitter budget` if the user gave one (`rtl-control-loop-jitter` does the full analysis).
4. Decide with this table and record the row:

| Measured | Recommendation |
|---|---|
| Max lateness below the user's budget over the full run | Python loop is acceptable for this run length and load; keep measuring after every change |
| Max above budget, spikes coincide with GC or other Python threads | Move other Python threads to a separate process; keep GC frozen |
| Max above budget after that | Move the timed loop to C, C++ or Rust (see `rtl-c-abs-deadline-loop`, `rtl-rust-rt-loop`) and keep Python for supervision |

### Output
`py_rt_patch`.

### Quality Gate
- `ps -o cls,rtprio -p <pid>` shows `FF` and `rt_priority`; `grep VmLck /proc/<pid>/status` is nonzero.
- Lateness min, median and max are reported with the sample count, and a table row is cited.

---

## Worked Example

Illustrative. Python 3.12 bench script reading wheel-speed frames with python-can and computing a filtered speed at 50 Hz (`loop_period_us` = 20000), `rt_priority` = 70.

Phase 2 applied; tests pass. Phase 3, one hour, 180000 samples:
```
min 21 us   median 48 us   max 812 us   above 1000 us: 0
```
With the user's budget of 1000 us, row 1 applies. A run with the collector enabled showed a max of 2.9 ms, which is why `gc.freeze(); gc.disable()` stays.

---

## Exit Criteria

DONE when the process runs SCHED_FIFO with locked memory and controlled GC, sleeps on absolute deadlines, tests pass, and the measured lateness leads to a recorded recommendation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `PermissionError` from `sched_setscheduler` | **Adjust**: grant rtprio; see `rtl-sched-fifo-chrt`. |
| Phase 2 | `mlockall` errno 12 (ENOMEM) | **Adjust**: raise memlock limit. |
| Phase 3 | Memory grows with GC disabled | **Return**: a cycle is created per iteration; find it with `gc.get_referrers` in a test, or re-enable GC and measure. |
| Phase 3 | Max above budget | **Return**: follow the table; do not lower the budget to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
