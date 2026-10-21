# CPU Isolation With Boot Parameters

**One-line description:** Isolates the real-time CPUs from the scheduler load balancer, the periodic tick, RCU callbacks and default interrupt placement using `isolcpus`, `nohz_full`, `rcu_nocbs` and `irqaffinity`, and verifies each one from sysfs and /proc after reboot.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kernel_report` (object, required): From `rtl-kernel-rt-check`. Supplies `cpus`, `smt_siblings`, `bootloader`, `cmdline`, and `CONFIG_NO_HZ_FULL`, `CONFIG_RCU_NOCB_CPU`, `CONFIG_CPU_ISOLATION`.
- `rt_cpus` (string, required): CPUs reserved for the control loop, kernel list format (`2-3`, `2,3,6,7`).
- `housekeeping_cpus` (string, required): CPUs left for everything else. Must include CPU 0 on most platforms and must not overlap `rt_cpus`.

---

## Outputs

- `isolation_config` (object): The exact parameters added, the bootloader file edited, and the post-reboot readings of `/proc/cmdline`, `/sys/devices/system/cpu/isolated`, `/sys/devices/system/cpu/nohz_full`, and the tick count check.

---

## Phase 1: Validate The CPU Split

### Entry Criteria
- `rt_cpus` and `housekeeping_cpus` are given.

### Actions
1. Expand both lists and confirm: no overlap, union equals `kernel_report.cpus`, `housekeeping_cpus` is not empty.
2. SMT check: for each CPU in `rt_cpus`, read its siblings from `kernel_report.smt_siblings`. If a sibling is in `housekeeping_cpus`, housekeeping work on the sibling shares the physical core with the loop. Use this rule: either put both siblings in `rt_cpus` (and leave the sibling idle or run only the loop's helper there), or disable SMT in firmware or with `echo off | sudo tee /sys/devices/system/cpu/smt/control`. Record the choice; do not decide silently.
3. Confirm the config: `CONFIG_NO_HZ_FULL=y` is needed for `nohz_full`, `CONFIG_RCU_NOCB_CPU=y` for `rcu_nocbs`. If missing, drop that parameter and record it.

### Output
Validated CPU lists and the parameter set to apply.

### Quality Gate
- The overlap check and the union check are written out with the expanded lists.
- Each parameter to be added has its required config option shown as `y` in `kernel_report.config`.

---

## Phase 2: Write The Boot Parameters

### Entry Criteria
- Phase 1 passed. Console access is available in case the system fails to boot.

### Actions
1. Build the parameter string:
   `isolcpus=domain,managed_irq,<rt_cpus> nohz_full=<rt_cpus> rcu_nocbs=<rt_cpus> irqaffinity=<housekeeping_cpus>`
   - `isolcpus=domain` removes the CPUs from scheduler load balancing domains: tasks go there only when explicitly pinned.
   - `managed_irq` keeps kernel-managed multiqueue interrupts (NVMe, some NICs) off isolated CPUs where the driver allows it.
   - `nohz_full` stops the periodic tick on a CPU when exactly one task is runnable there.
   - `rcu_nocbs` moves RCU callback processing to kthreads, which you then pin to housekeeping CPUs.
   - `irqaffinity` sets the default affinity for interrupts.
   The kernel parameter documentation (`Documentation/admin-guide/kernel-parameters.txt`) is the reference; check flags against the version you run.
2. Edit only one file, according to `kernel_report.bootloader`:

| Bootloader | File and change | Apply |
|---|---|---|
| grub (Debian family) | Append to `GRUB_CMDLINE_LINUX_DEFAULT` in `/etc/default/grub` | `sudo update-grub` |
| grub (RHEL family) | `sudo grubby --update-kernel=ALL --args="<params>"` | automatic |
| extlinux (Jetson) | Append to the `APPEND` line of the RT kernel's `LABEL` in `/boot/extlinux/extlinux.conf` | none |
| Raspberry Pi | Append to the single line in `/boot/firmware/cmdline.txt` | none |

3. Back up the file first: `sudo cp <file> <file>.pre-rt`. Do not edit any other boot file.
4. Alternative on RHEL-family systems: the `tuned` profile `cpu-partitioning` with `isolated_cores=<rt_cpus>` in `/etc/tuned/cpu-partitioning-variables.conf`, then `sudo tuned-adm profile cpu-partitioning`. It writes equivalent parameters. Use one method, not both.

### Output
Edited boot configuration and its backup.

### Quality Gate
- `diff <file>.pre-rt <file>` shows only the added parameters.
- For grub, the generated `grub.cfg` contains the parameters: `grep -c 'nohz_full=' /boot/grub/grub.cfg` (or your distro's grub.cfg path) is at least 1.

---

## Phase 3: Reboot And Verify

### Entry Criteria
- Phase 2 complete.

### Actions
1. Reboot. Then `cat /proc/cmdline` and confirm every parameter appears.
2. `cat /sys/devices/system/cpu/isolated` must print `rt_cpus`. `cat /sys/devices/system/cpu/nohz_full` must print `rt_cpus`.
3. Check that ordinary tasks avoid the RT CPUs: `ps -eo pid,psr,comm | awk '$2 ~ /^(<rt cpu ids as regex alternation>)$/'`. Remaining entries should be per-CPU kernel threads (`ksoftirqd/N`, `cpuhp/N`, `migration/N`, `kworker/N:*`, `irq/*` not yet moved). User processes there mean isolation is not in effect.
4. Move RCU offload threads to housekeeping CPUs: `for p in $(pgrep -f 'rcuo'); do sudo taskset -pc <housekeeping_cpus> $p; done`. Record any that refuse.
5. Tick check: run a single pinned busy task on one RT CPU (`taskset -c <cpu> sh -c 'while :; do :; done' &`), read the `LOC` row of `/proc/interrupts` for that CPU twice 10 seconds apart, then kill the task. With `nohz_full` working, the LOC count on that CPU grows far slower than on a housekeeping CPU. Record both deltas.

### Output
`isolation_config`.

### Quality Gate
- `/sys/devices/system/cpu/isolated` and `/sys/devices/system/cpu/nohz_full` contents are recorded and equal `rt_cpus`.
- The LOC deltas for an RT CPU and a housekeeping CPU are both recorded.

---

## Worked Example

Illustrative. 4 cores, no SMT, `rt_cpus` = `2-3`, `housekeeping_cpus` = `0-1`, grub on Debian.

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet isolcpus=domain,managed_irq,2-3 nohz_full=2-3 rcu_nocbs=2-3 irqaffinity=0-1"
$ sudo update-grub && sudo reboot
$ cat /sys/devices/system/cpu/isolated
2-3
$ cat /sys/devices/system/cpu/nohz_full
2-3
$ grep LOC /proc/interrupts   # 10 s apart, busy loop pinned on CPU 3
LOC:   1203345   1198871     88412     51007
LOC:   1213351   1208877     88420     51009
```
CPU 0 grew by 10006, CPU 3 by 2: the tick is stopped on CPU 3 while one task runs.

---

## Exit Criteria

DONE when the parameters are active in `/proc/cmdline`, sysfs reports the isolated and nohz_full sets equal to `rt_cpus`, user tasks are absent from the RT CPUs, and the tick check is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lists overlap or housekeeping empty | **Return**: ask the user for corrected lists. |
| Phase 1 | `CONFIG_NO_HZ_FULL` not set | **Adjust**: omit `nohz_full`; note that the tick remains on RT CPUs. |
| Phase 2 | update-grub fails | **Stop**: restore `<file>.pre-rt` and report the error. |
| Phase 3 | System does not boot | **Adjust**: at the grub menu press `e`, remove the added parameters for this boot, then restore the backup. |
| Phase 3 | LOC grows equally on RT and housekeeping CPU | **Return**: more than one task is runnable on that CPU or nohz_full is inactive; check `ps -eo psr,comm` and `/sys/devices/system/cpu/nohz_full`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
