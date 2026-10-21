# Timer Slack For Control Threads

**One-line description:** Reads the timer slack of every thread in a control process from `/proc/<pid>/task/<tid>/timerslack_ns`, explains which threads it affects (normal-policy threads only), and sets it with `prctl(PR_SET_TIMERSLACK)` or the proc file for normal-policy threads whose sleeps feed the control loop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_command` (string, required): Command that starts the process, used to find its PID.

---

## Outputs

- `timer_slack_report` (object): Per thread TID, name, policy, timer slack in ns before and after, and whether the thread's sleep timing matters to the loop; the method used to set it; a measured before and after sleep overshoot for each changed thread.

---

## Phase 1: Read Current Slack

### Entry Criteria
- The process is running (`pgrep -f '<binary>'` returns a PID).
- If the process commands actuators: bench or closed course only, behind an independent hardware emergency stop; otherwise actuator outputs disabled.

### Actions
1. For each thread: `for t in /proc/<pid>/task/*; do echo "$(basename $t) $(cat $t/comm) $(cat $t/timerslack_ns)"; done`. The `timerslack_ns` file exists from Linux 4.6.
2. Read each thread's policy: `ps -L -o tid,cls,rtprio,comm -p <pid>`.
3. Facts (from `man 2 prctl` and the kernel hrtimer code): timer slack lets the kernel delay a timer expiry by up to the slack to group wakeups. The default for a new process is 50000 ns (50 us), inherited from the parent. Threads under SCHED_FIFO, SCHED_RR or SCHED_DEADLINE do not get slack applied to their sleeps. So the RT loop thread is not affected; normal-policy helper threads are.

### Output
Per thread slack and policy.

### Quality Gate
- Every thread has a recorded slack value and policy class.

---

## Phase 2: Decide Which Threads To Change

### Entry Criteria
- Phase 1 complete.

### Actions
1. Apply this table:

| Thread | Change slack? |
|---|---|
| Policy `FF`, `RR` or `DLN` | No; slack is not applied |
| Normal policy (`TS`) thread whose timed sleep paces data the loop needs (for example a sensor poller that wakes on a timer) | Yes, set to 1 ns (the smallest; 0 means "reset to default" in `prctl`) |
| Normal policy thread with no timing role (logging, UI) | No |
| A thread that should be real-time but shows `TS` | Not a slack issue; return to `rtl-sched-fifo-chrt` |

2. Record the decision per thread.

### Output
List of threads to change.

### Quality Gate
- Each thread has a table row cited.

---

## Phase 3: Set And Measure

### Entry Criteria
- At least one thread to change; otherwise record "no change needed" and finish.

### Actions
1. Measure before: in a test harness in the thread, or by tracing, record how late its `clock_nanosleep` or `nanosleep` returns versus the requested time over many sleeps. A simple external check is `sudo trace-cmd record -e timer:hrtimer_start -e timer:hrtimer_expire_entry -P <tid>` and comparing the `softexpires` and `expires` fields in `hrtimer_start` (the difference is the slack applied).
2. Set from code (preferred, persistent): in that thread, `prctl(PR_SET_TIMERSLACK, 1UL, 0, 0, 0);` (C, `#include <sys/prctl.h>`). From Rust: `libc::prctl(libc::PR_SET_TIMERSLACK, 1, 0, 0, 0)`. From Python: `ctypes.CDLL("libc.so.6").prctl(29, 1, 0, 0, 0)` where 29 is `PR_SET_TIMERSLACK` on Linux; confirm in `<linux/prctl.h>`.
3. Set from outside (testing only, needs `CAP_SYS_NICE` for another process): `echo 1 | sudo tee /proc/<pid>/task/<tid>/timerslack_ns`. Lost on restart.
4. Measure after with the same method. Read back `timerslack_ns`.

### Output
`timer_slack_report`.

### Quality Gate
- `cat /proc/<pid>/task/<tid>/timerslack_ns` prints `1` for each changed thread.
- Before and after `expires - softexpires` (or measured overshoot) are both recorded.

---

## Worked Example

Illustrative. Process `steer_ctl`: `ctl_loop` FF 80, `imu_poll` TS polling an IMU every 2 ms with `clock_nanosleep`, `logger` TS.

```
$ for t in /proc/2210/task/*; do echo "$(basename $t) $(cat $t/comm) $(cat $t/timerslack_ns)"; done
2210 steer_ctl 50000
2214 ctl_loop 50000
2216 imu_poll 50000
2217 logger 50000
```
`ctl_loop`: no (FF). `imu_poll`: yes (paces data). `logger`: no. Before: `hrtimer_start` for `imu_poll` shows `expires - softexpires` = 50000 ns. After adding `prctl(PR_SET_TIMERSLACK, 1UL, 0, 0, 0)` at `imu_poll` start: `timerslack_ns` reads 1 and the difference is 1 ns.

---

## Exit Criteria

DONE when every thread's slack and policy are recorded, each change follows a table row, and changed threads read back slack 1 with before and after measurements.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `timerslack_ns` missing | **Adjust**: kernel older than 4.6; read slack with `prctl(PR_GET_TIMERSLACK)` inside the process. |
| Phase 3 | `tee: ... Operation not permitted` | **Adjust**: needs `CAP_SYS_NICE`; use sudo or set it from code. |
| Phase 3 | Slack resets after restart | **Adjust**: the proc write is temporary; set it in code. |
| Phase 3 | No measurable change | **Return**: the thread's lateness is not slack; hand to `rtl-rtla-timerlat`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
