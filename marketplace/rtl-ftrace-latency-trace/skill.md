# Trace A Latency Spike With trace-cmd

**One-line description:** Records scheduler, interrupt and timer events with trace-cmd while cyclictest runs with `--breaktrace` and `--tracemark`, so tracing stops at the first spike above the budget, then reads the trace backwards from the marker to name what ran instead of the latency thread.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `latency_findings` (object, required): From `rtl-cyclictest-histogram-read`. Supplies `worst_cpu`.
- `rt_cpus` (string, required): RT CPUs; tracing is limited to them to keep the buffer small.
- `jitter_budget_us` (integer, required): Break threshold for cyclictest.

---

## Outputs

- `trace_findings` (object): The trace file path (`trace.dat`), the CPU and timestamp of the spike, the ordered list of events between the expected wakeup and the actual one, the named cause, and the KernelShark view instructions used.

---

## Phase 1: Prepare Tracing

### Entry Criteria
- `trace-cmd` installed (`sudo apt install trace-cmd`; KernelShark optional, `sudo apt install kernelshark`).
- `CONFIG_FTRACE=y` in `kernel_report.config`.
- No other tracer active: `cat /sys/kernel/tracing/current_tracer` prints `nop`.

### Actions
1. Confirm cyclictest options: `cyclictest --help | grep -E 'breaktrace|tracemark'`. `-b/--breaktrace=USEC` stops tracing when a latency exceeds USEC. `--tracemark` writes a marker into the trace when that happens.
2. Choose events. Start narrow; the buffer fills fast:
   `-e sched:sched_switch -e sched:sched_wakeup -e sched:sched_waking -e irq:irq_handler_entry -e irq:irq_handler_exit -e irq:softirq_entry -e irq:softirq_exit -e timer:hrtimer_expire_entry -e timer:hrtimer_expire_exit`
   Add `-e irq_vectors` on x86 for local timer and other vectors. List available events with `trace-cmd list -e | grep <name>`.
3. Set a per-CPU buffer large enough: `-b <kb>`; check `trace-cmd record --help`.

### Output
Chosen event list and buffer size.

### Quality Gate
- Every event listed is printed by `trace-cmd list -e` on this machine.

---

## Phase 2: Capture

### Entry Criteria
- Phase 1 complete. Same load conditions as the run that showed the spike.

### Actions
1. Start tracing without stopping on its own: `sudo trace-cmd start -M <hex mask of rt_cpus> <events> -b <kb>`. `-M` limits tracing to those CPUs (check `trace-cmd start --help`).
2. Run cyclictest on the worst CPU: `sudo cyclictest -m -a <worst_cpu> -t 1 -p <priority of the original run> -i <interval of the original run> -b <jitter_budget_us> --tracemark -D <duration the user allows>`. Take priority and interval from the command line recorded with `latency_findings`.. When latency exceeds the threshold, cyclictest prints the value and stops tracing, then exits.
3. Save the buffer: `sudo trace-cmd extract -o trace.dat`, then `sudo trace-cmd reset` to restore the tracing state.
4. If cyclictest ends without breaking, record `not reproduced in <duration>` and stop.

### Output
`trace.dat` with the spike at its end.

### Quality Gate
- cyclictest printed a break message with a latency at or above `jitter_budget_us`.
- `trace-cmd report trace.dat | grep -c tracing_mark_write` is at least 1.

---

## Phase 3: Read The Trace

### Entry Criteria
- `trace.dat` exists.

### Actions
1. Show the tail around the marker on the worst CPU: `trace-cmd report -l --cpu <worst_cpu> trace.dat | tail -200`. `-l` adds the latency format columns (interrupts disabled `d`, need-resched `N`, hardirq `h`, softirq `s`, preempt depth).
2. Find the cyclictest thread's `sched_waking` or the `hrtimer_expire_entry` of its timer, and the `sched_switch` that finally switched to it. The interval between them is the latency.
3. List every event on that CPU in that interval, in order. Classify:

| Event in the gap | Cause |
|---|---|
| `irq_handler_entry name=X` with long gap to exit | Hard IRQ X |
| `softirq_entry vec=N` long | Softirq N (NET_RX, TIMER, etc.) |
| `sched_switch` to another task with priority >= cyclictest | That task |
| `sched_switch` to a lower priority task while the latency thread was runnable | Preemption disabled or migrate disabled region; look at the preempt depth column |
| Nothing for the whole gap and `d` flags absent | Hardware, firmware, or idle exit; check `rtl-hw-noise-check` and `rtl-power-cstate-tuning` |

4. Optional view: `kernelshark trace.dat`, filter to the worst CPU, and place markers at the waking and switch events.
5. Write `trace_findings` with the event list and the named cause.

### Output
`trace_findings`.

### Quality Gate
- The gap start and end timestamps are quoted from the report, and their difference matches the cyclictest break value within the trace's resolution.
- The cause names a table row and the specific event line.

---

## Worked Example

Illustrative. `worst_cpu` = 3, budget 50 us.

```
$ sudo trace-cmd start -M 8 -e sched -e irq -e timer -b 20000
$ sudo cyclictest -m -a 3 -t 1 -p 80 -i 1000 -b 50 --tracemark -D 1h
# Thread Ids: 5120
# Break thread: 5120
# Break value: 63
$ sudo trace-cmd extract -o trace.dat && sudo trace-cmd reset
$ trace-cmd report -l --cpu 3 trace.dat | tail -12
 <idle>-0  3d.h1.  4021.118400: hrtimer_expire_entry: hrtimer=... function=hrtimer_wakeup
 <idle>-0  3d.h1.  4021.118401: sched_waking: comm=cyclictest pid=5120 prio=19 target_cpu=003
 <idle>-0  3d.h..  4021.118402: irq_handler_entry: irq=131 name=nvme0q3
 <idle>-0  3d.h..  4021.118459: irq_handler_exit: irq=131 ret=handled
 <idle>-0  3d...   4021.118462: sched_switch: prev_comm=swapper/3 ... next_comm=cyclictest
```
Gap from waking (…118401) to switch (…118462) = 61 us, of which `nvme0q3` hard IRQ took 57 us. Cause: hard IRQ `nvme0q3` (table row 1).

---

## Exit Criteria

DONE when a trace ending at a spike above the budget is saved, the gap is measured from trace timestamps, and the cause is named from a specific event line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Event not found | **Adjust**: use `trace-cmd list -e` names for this kernel version. |
| Phase 2 | Buffer overwritten before break | **Retry**: increase `-b` or narrow events. |
| Phase 2 | Spike not reproduced | **Return**: report `not reproduced`; rerun under the load that showed it. |
| Phase 3 | Gap shows nothing | **Return**: suspect hardware; pass to `rtl-hw-noise-check`. |
| Any | Tracing left on | **Adjust**: always finish with `sudo trace-cmd reset`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
