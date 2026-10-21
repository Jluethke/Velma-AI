# Run The Control Process Under SCHED_FIFO

**One-line description:** Starts the control process under SCHED_FIFO at a chosen priority and CPU affinity with chrt and taskset or a systemd unit, with RLIMIT_RTPRIO and RLIMIT_MEMLOCK granted, RT throttling understood, and every thread's policy verified from ps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_command` (string, required): The command that starts the control process, with arguments.
- `rt_priority` (integer, required): SCHED_FIFO priority for the control thread, 1 to 98.
- `rt_cpus` (string, required): CPUs the process may run on.
- `isolation_config` (object, optional): From `rtl-cpu-isolation-bootargs`. When present, `rt_cpus` must be inside its isolated set.

---

## Outputs

- `sched_config` (object): Launch method (chrt command or unit file path and contents), limits granted, `sched_rt_runtime_us` and `sched_rt_period_us` values read, and per thread PID, policy, priority and CPU affinity read back while running.

---

## Phase 1: Grant Limits

### Entry Criteria
- If the process commands motion, steering, braking, throttle or any actuator: it runs only on a bench or a closed course, with an independent hardware emergency stop that cuts actuator power without software involvement. Braking and emergency-stop paths are never gated, delayed or blocked by this or any software. Otherwise run with actuator outputs disabled or simulated.

### Actions
1. Decide who launches the process: root via systemd (recommended for a fixed controller) or a user account.
2. For a user account, create `/etc/security/limits.d/90-rt.conf` with lines for a group the user belongs to:
   `@realtime - rtprio <max priority the group may use>`
   `@realtime - memlock unlimited`
   Then log out and in, and check `ulimit -r` and `ulimit -l`. limits.conf applies to PAM sessions; it does not apply to systemd services.
3. For systemd, limits go in the unit: `LimitRTPRIO=<n>` and `LimitMEMLOCK=infinity`.
4. Read RT throttling: `cat /proc/sys/kernel/sched_rt_runtime_us /proc/sys/kernel/sched_rt_period_us`. Documented defaults are 950000 and 1000000: RT tasks may use at most 95% of each second per CPU, after which non-RT tasks get the rest. A control loop that sleeps every period never hits this; a runaway loop is throttled and `dmesg` shows `sched: RT throttling activated`. Do not set `sched_rt_runtime_us` to -1 as a fix for a loop that spins; fix the loop.
5. If `kernel_report` noted `CONFIG_RT_GROUP_SCHED=y`, the process's cgroup needs `cpu.rt_runtime_us` > 0 or setting SCHED_FIFO fails with EPERM. Record it.

### Output
Limits in place.

### Quality Gate
- `ulimit -r` (user launch) or `systemctl show <unit> -p LimitRTPRIO` (service) prints a value at or above `rt_priority`.
- Both RT throttling values are recorded.

---

## Phase 2: Launch

### Entry Criteria
- Phase 1 complete.

### Actions
1. Priority check: do not use 99. Keep `rt_priority` below the IRQ threads the loop depends on (see `rtl-threaded-irq-priority`).
2. Command-line launch: `sudo chrt -f <rt_priority> taskset -c <rt_cpus> <app_command>`. Every thread inherits SCHED_FIFO at that priority unless the program changes it. If only one thread should be real-time (common: the control thread real-time, logging and network threads normal), the program must set its own policy per thread with `pthread_setschedparam` (C/C++), libc calls (Rust) or `os.sched_setscheduler` (Python); launch then without chrt and only with `taskset`.
3. systemd launch: create `/etc/systemd/system/<name>.service`:
   ```
   [Service]
   ExecStart=<app_command>
   CPUSchedulingPolicy=fifo
   CPUSchedulingPriority=<rt_priority>
   CPUAffinity=<rt_cpus>
   LimitRTPRIO=<rt_priority>
   LimitMEMLOCK=infinity
   Slice=rt.slice
   ```
   Omit `Slice=` if `rtl-cpuset-partition` was not run. Then `sudo systemctl daemon-reload && sudo systemctl start <name>`.
4. Do not run the loop under SCHED_FIFO while it busy-waits; a priority FIFO busy loop on a CPU starves everything else on that CPU until throttling.

### Output
Running process.

### Quality Gate
- The process is running: `pgrep -f '<binary name>'` prints a PID.

---

## Phase 3: Verify Every Thread

### Entry Criteria
- Process running.

### Actions
1. `ps -L -o tid,cls,rtprio,psr,comm -p <pid>`. For each thread: `CLS` is `FF` for SCHED_FIFO, `TS` for normal; `RTPRIO` the priority; `PSR` the CPU it last ran on.
2. `taskset -pc <tid>` per thread to read affinity.
3. Compare against intent: the control thread at `rt_priority` on `rt_cpus`; helper threads as designed.
4. Check `dmesg | grep -i 'rt throttling'` after a few minutes of running.

### Output
`sched_config`.

### Quality Gate
- The control thread shows `FF` and `rt_priority` in `ps`, and `taskset -pc` prints a subset of `rt_cpus`.
- `dmesg` shows no RT throttling message since launch.

---

## Worked Example

Illustrative. `app_command` = `/opt/ctl/bin/steer_ctl --config /etc/ctl.yaml` on a bench rig with a hardware e-stop on actuator power; `rt_priority` = 80; `rt_cpus` = `2`.

```
$ cat /proc/sys/kernel/sched_rt_runtime_us /proc/sys/kernel/sched_rt_period_us
950000
1000000
$ sudo systemctl start steer-ctl
$ ps -L -o tid,cls,rtprio,psr,comm -p $(pgrep -f steer_ctl)
  TID CLS RTPRIO PSR COMMAND
 2210  TS      -   2 steer_ctl
 2214  FF     80   2 ctl_loop
 2215  TS      -   2 can_logger
```
The control thread `ctl_loop` is FF 80 on CPU 2; the program sets it per thread, so the unit omits `CPUSchedulingPolicy`. `can_logger` sharing CPU 2 at normal priority is acceptable by design; recorded.

---

## Exit Criteria

DONE when the control thread runs SCHED_FIFO at `rt_priority` on `rt_cpus`, limits are granted for the launch method, and no RT throttling has occurred.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No hardware e-stop for an actuator-commanding process | **Stop**: do not launch with actuator outputs live. |
| Phase 2 | `chrt: failed to set pid ... Operation not permitted` | **Adjust**: check `ulimit -r`, root, or `cpu.rt_runtime_us` for the cgroup. |
| Phase 2 | System freezes after launch | **Stop**: the loop spins at RT priority; reboot, fix the loop to sleep each period. |
| Phase 3 | Control thread shows `TS` | **Return**: the program resets its own policy; fix in code. |
| Phase 3 | RT throttling in dmesg | **Return**: loop exceeds 95% CPU; profile it. Do not disable throttling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
