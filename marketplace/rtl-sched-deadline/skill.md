# Run A Periodic Loop Under SCHED_DEADLINE

**One-line description:** Runs a periodic control process under SCHED_DEADLINE with `chrt -d` or `sched_setattr`, with runtime, deadline and period set from the measured worst-case execution time and loop period, admission control and CPU affinity rules respected, and overruns detected.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_command` (string, required): Command that starts the process.
- `loop_period_us` (integer, required): The control loop's period in microseconds.
- `runtime_us` (integer, required): CPU time reserved per period, in microseconds. The user sets it from a measured worst-case execution time of one loop iteration plus a margin they choose. This flow does not invent the margin.
- `isolation_config` (object, optional): From `rtl-cpu-isolation-bootargs`.

---

## Outputs

- `deadline_config` (object): Runtime, deadline and period in nanoseconds, the launch command or code, the root domain or cpuset arrangement used, the admission check result, and overrun counts observed.

---

## Phase 1: Check Parameters And Admission

### Entry Criteria
- If the process commands motion, steering, braking, throttle or any actuator: bench or closed course only, behind an independent hardware emergency stop that removes actuator power without software. Braking and emergency-stop paths are never gated or delayed by this scheduler choice.

### Actions
1. Convert to nanoseconds: runtime = `runtime_us` * 1000, period = `loop_period_us` * 1000. Deadline defaults to period (implicit deadline); a shorter deadline is a user choice.
2. Check the kernel's rule: runtime <= deadline <= period. If not, stop.
3. Admission control: the kernel rejects a task when the total reserved bandwidth on the root domain exceeds the RT limit set by `sched_rt_runtime_us / sched_rt_period_us` times the number of CPUs in the domain. Compute this task's bandwidth runtime/period and add other deadline tasks you run (`ps -eLo pid,cls,comm | awk '$2=="DLN"'`).
4. Affinity rule (from `Documentation/scheduler/sched-deadline.rst`): a SCHED_DEADLINE task cannot have a CPU affinity narrower than its root domain; `sched_setaffinity` on it fails. To restrict a deadline task to `rt_cpus`, create an exclusive root domain with a cpuset partition (`rtl-cpuset-partition` step 4, partition `root`) and run the task inside it. With `isolcpus=domain`, each isolated CPU is its own domain; confirm the layout with the kernel docs for your version.
5. Fork rule: `fork()` or thread creation from a SCHED_DEADLINE task fails with EAGAIN unless the task set `SCHED_FLAG_RESET_ON_FORK`, in which case the child starts as a normal task. Start helper threads before switching to SCHED_DEADLINE, or switch only the loop thread.

### Output
Checked parameters in nanoseconds.

### Quality Gate
- runtime <= deadline <= period is shown with the numbers.
- The total deadline bandwidth on the domain is computed and shown below the limit.

---

## Phase 2: Launch

### Entry Criteria
- Phase 1 passed.

### Actions
1. Command-line: `sudo chrt -d --sched-runtime <ns> --sched-deadline <ns> --sched-period <ns> 0 <app_command>`. The priority argument must be 0 for SCHED_DEADLINE. Confirm option names with `chrt --help`.
2. From code (C), per thread: fill `struct sched_attr` (`size`, `sched_policy = SCHED_DEADLINE`, `sched_runtime`, `sched_deadline`, `sched_period`, optionally `sched_flags = SCHED_FLAG_DL_OVERRUN` to receive SIGXCPU on overrun) and call `syscall(SYS_sched_setattr, 0, &attr, 0)`. Newer glibc versions provide a `sched_setattr` wrapper; check `man 2 sched_setattr` on the machine.
3. In the loop, call `sched_yield()` at the end of each iteration: for a deadline task this tells the kernel the job is done and the task sleeps until the next period. Do not combine it with a separate `clock_nanosleep` period timer unless you have read the sched-deadline docs on how the two interact.
4. Do not use SCHED_DEADLINE inside a container or VM without checking the host allows it.

### Output
Running deadline task.

### Quality Gate
- `chrt -p <tid>` prints `SCHED_DEADLINE` with the runtime, deadline and period set.

---

## Phase 3: Watch For Overruns

### Entry Criteria
- Task running for at least the user's test duration.

### Actions
1. Overrun means the job used its full runtime before finishing; the kernel throttles it until the next period. Detect by: SIGXCPU count if `SCHED_FLAG_DL_OVERRUN` set; or tracing `sched:sched_switch` with the task and checking for throttle gaps; or the application's own deadline-miss counter (`rtl-control-loop-jitter`).
2. Confirm parameters with `chrt -p <tid>`. `/proc/<pid>/sched` may also show deadline fields on kernels built with scheduler debugging; field names vary by version, so grep for `dl` and read what is there rather than assuming names.
3. If overruns occur, the reservation is too small for the real execution time. Return the measured execution time to the user; do not raise runtime silently.

### Output
`deadline_config`.

### Quality Gate
- Overrun count over the run is a number read from the chosen detector.
- Parameters read back from `chrt -p` match Phase 1.

---

## Worked Example

Illustrative. `loop_period_us` = 2000, `runtime_us` = 400 (user measured 310 us worst case and chose the margin), bench rig.

```
runtime 400000 ns <= deadline 2000000 ns <= period 2000000 ns   OK
bandwidth 0.2 of 0.95 on a one-CPU root domain                  OK
$ sudo chrt -d --sched-runtime 400000 --sched-deadline 2000000 --sched-period 2000000 0 /opt/ctl/bin/lat_ctl
$ chrt -p $(pgrep lat_ctl)
pid 3311's current scheduling policy: SCHED_DEADLINE
pid 3311's current runtime/deadline/period parameters: 400000/2000000/2000000
```
After 1 h, the SIGXCPU counter in the app reads 0.

---

## Exit Criteria

DONE when the task runs SCHED_DEADLINE with checked parameters, admission and affinity rules are satisfied, and overruns over the run are counted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | runtime > deadline or deadline > period | **Return**: ask for corrected values. |
| Phase 2 | `EBUSY` on launch | **Adjust**: admission failed; reduce other deadline load or ask the user to revisit the reservation. |
| Phase 2 | `EPERM` setting affinity | **Adjust**: use an exclusive cpuset root domain instead of taskset. |
| Phase 2 | `EAGAIN` on fork | **Adjust**: start threads before switching policy. |
| Phase 3 | Overruns | **Return**: report measured execution time; the user decides the reservation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
