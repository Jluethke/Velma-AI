# Threaded IRQ Priorities

**One-line description:** Finds the threaded interrupt handlers (`irq/<n>-<name>`) the control loop depends on, sets their SCHED_FIFO priority and CPU affinity relative to the loop's priority with chrt and taskset, and makes the setting survive driver reloads and reboots.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `irq_affinity_map` (object[], required): From `rtl-irq-affinity`. IRQ numbers, names and CPUs.
- `rt_priority` (integer, required): The control loop's SCHED_FIFO priority.
- `rt_device_irqs` (object[], optional): The devices whose data the loop needs within its period. Empty means only the default priorities are documented.

---

## Outputs

- `irq_thread_priorities` (object[]): One row per relevant IRQ thread: PID, name, policy, priority before and after, CPU affinity, and the persistence mechanism.

---

## Phase 1: List IRQ Threads

### Entry Criteria
- On a PREEMPT_RT kernel, interrupt handlers run as kernel threads by default (except those registered with `IRQF_NO_THREAD`, such as timer interrupts). On a non-RT kernel they are threads only with the `threadirqs` boot parameter. Check `/proc/cmdline` or `uname -v`.

### Actions
1. List threads: `ps -eLo pid,cls,rtprio,psr,comm | grep -E 'irq/|ksoftirqd|ktimers|rcuc|rcub'`. `CLS` FF means SCHED_FIFO.
2. Note the default: IRQ threads start at SCHED_FIFO priority 50 (`MAX_RT_PRIO/2` in the kernel source). Record each thread's current priority as read; do not assume.
3. For each device in `rt_device_irqs`, find its IRQ number in `irq_affinity_map` and its thread `irq/<n>-<name>`. A device with several MSI vectors has several threads.
4. Also record `ktimers/N` (hrtimer softirq thread on recent RT kernels) and `ksoftirqd/N` on the RT CPUs. Network receive processing on an RT kernel can run in these threads, so their priority matters for Ethernet-based loops.

### Output
Table of relevant threads and their current settings.

### Quality Gate
- Every `rt_device_irqs` device maps to at least one listed thread, or is marked `not threaded` with the reason.

---

## Phase 2: Choose Priorities

### Entry Criteria
- Phase 1 complete.

### Actions
1. Apply this ordering rule. It is an engineering convention, not a standard; the user may override it with reasons recorded:

| Thread | Priority relative to `rt_priority` |
|---|---|
| IRQ thread of a device the loop waits on inside its period | Above `rt_priority` (the data must be delivered before the loop can use it) |
| IRQ threads of unrelated devices | Leave at default; must stay below `rt_priority` if they share the loop's CPU |
| `ktimers/N` on RT CPUs (if present) | Leave at its default unless tracing shows the loop's wakeup waiting on it |
| Control loop | `rt_priority` |
| Priority 99 | Do not use; kernel per-CPU threads such as `migration/N` run there |

2. Check `rt_priority`: if it is 50 or lower, unrelated IRQ threads at 50 can preempt or tie with the loop. Report this to the user; do not silently change `rt_priority`.
3. Write the target priority for each thread from the table.

### Output
Target priority per thread.

### Quality Gate
- Every target priority cites a table row, and none is 99.

---

## Phase 3: Apply And Persist

### Entry Criteria
- Phase 2 complete.

### Actions
1. Set priority: `sudo chrt -f -p <prio> <pid>`. Read back with `chrt -p <pid>`; it prints the policy and priority.
2. Set CPU affinity to match the IRQ's affinity: `sudo taskset -pc <cpu> <pid>`. The kernel normally follows the IRQ's affinity; read back with `taskset -pc <pid>`.
3. Persistence: PIDs change on every boot and on driver reload or interface down/up. Use one of:
   - A systemd oneshot unit ordered after the device comes up (`After=sys-subsystem-net-devices-can0.device` or your CAN setup service) whose script finds the PID with `pgrep -x 'irq/<n>-<name>'` (or matches by name suffix, because the IRQ number can change) and runs `chrt -f -p`.
   - `tuna` (`tuna --help` to confirm options on your version), which can set thread priority by name pattern.
   - The `tuned` realtime profile on RHEL family systems.
4. Verify after reboot and after `sudo ip link set can0 down && sudo ip link set can0 up` (or the equivalent restart of your device) that priorities are reapplied.

### Output
`irq_thread_priorities`.

### Quality Gate
- `chrt -p <pid>` for each relevant thread prints `SCHED_FIFO` and the target priority, after reboot and after a device restart.

---

## Worked Example

Illustrative. `rt_priority` = 80, loop reads `can0` (IRQ 129, on CPU 2) every 10 ms.

```
$ ps -eLo pid,cls,rtprio,psr,comm | grep -E 'irq/129|ktimers/2'
  412  FF   50   2 irq/129-can0
   30  FF    1   2 ktimers/2
$ sudo chrt -f -p 85 412
$ chrt -p 412
pid 412's current scheduling policy: SCHED_FIFO
pid 412's current scheduling priority: 85
```
Unrelated `irq/128-enp1s0` stays at 50 on CPU 0. A oneshot unit `rt-irq-prio.service` runs after `can-setup.service` and sets `irq/*-can0` to 85.

---

## Exit Criteria

DONE when each IRQ thread the loop depends on runs above `rt_priority` on its intended CPU, unrelated IRQ threads stay below it on shared CPUs, and the setting reapplies after reboot and device restart.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `irq/` threads | **Return**: kernel is not RT and lacks `threadirqs`; report that device handler time cannot be prioritized. |
| Phase 3 | `chrt: failed to set pid ... policy: Operation not permitted` | **Adjust**: use sudo. |
| Phase 3 | Setting lost after interface restart | **Retry**: fix the unit's ordering or trigger it from a udev rule on the device's add event. |
| Phase 3 | Loop latency worsens after raising an IRQ thread | **Return**: hand to `rtl-rtla-timerlat` with the before and after numbers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
