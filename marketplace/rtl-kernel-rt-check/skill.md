# Real-Time Kernel Check

**One-line description:** Determines whether the running Linux kernel is a PREEMPT_RT kernel, records the preemption model, the relevant kernel config options, and the CPU topology, so every later real-time step starts from facts read off the machine.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_host` (string, required): The machine to inspect. Either `local` or an SSH destination such as `user@controller.local`. Every command below runs on this machine (prefix with `ssh <target_host>` when remote).

---

## Outputs

- `kernel_report` (object): `kernel_release` (uname -r), `kernel_version` (uname -v), `arch` (uname -m), `preempt_rt` (true or false), `preempt_model` (string as read), `config_source` (path the config was read from), `config` (map of the options listed in Phase 2 to their values), `cpus` (list of online CPU ids), `smt_siblings` (map CPU to sibling list), `numa_nodes` (count), `cmdline` (contents of /proc/cmdline), `bootloader` (grub, extlinux, systemd-boot, or rpi cmdline.txt).

---

## Phase 1: Identify The Kernel

### Entry Criteria
- `target_host` is reachable: `ssh <target_host> true` exits 0, or `target_host` is `local`.

### Actions
1. Run `uname -r`, `uname -v` and `uname -m`. Record all three verbatim.
2. Run `cat /sys/kernel/realtime 2>/dev/null; echo "rc=$?"`. A PREEMPT_RT kernel provides this file and it reads `1`. If the file is missing, that alone does not prove a non-RT kernel on every version; continue to Phase 2.
3. Check whether `uname -v` contains the string `PREEMPT_RT`. Run `uname -v | grep -o 'PREEMPT[_A-Z]*'` and record every match.
4. If debugfs is mounted, run `sudo cat /sys/kernel/debug/sched/preempt 2>/dev/null`. On kernels with dynamic preemption this prints the models with the active one in parentheses, for example `none voluntary (full) lazy`. Record the line. Do not write to this file.
5. Run `cat /proc/cmdline` and record it. Look for `preempt=` (dynamic preemption override), `isolcpus=`, `nohz_full=`, `rcu_nocbs=`, `irqaffinity=`, `threadirqs`, `idle=`, `intel_idle.max_cstate=`, `processor.max_cstate=`.

### Output
Raw identity of the kernel: release, version string, architecture, realtime flag, active preemption model, command line.

### Quality Gate
- `kernel_release`, `kernel_version` and `arch` are filled with the literal command output.
- The result of `/sys/kernel/realtime` is recorded as `1`, `0`, or `missing`.

---

## Phase 2: Read The Kernel Config

### Entry Criteria
- Phase 1 complete.

### Actions
1. Find the config in this order and use the first that exists: `/boot/config-$(uname -r)`, `/proc/config.gz` (read with `zcat /proc/config.gz`), `/lib/modules/$(uname -r)/build/.config`. Record the path as `config_source`.
2. Extract these options with `grep -E '^(# )?CONFIG_(PREEMPT_RT|PREEMPT|PREEMPT_DYNAMIC|PREEMPT_VOLUNTARY|PREEMPT_NONE|NO_HZ_FULL|RCU_NOCB_CPU|HZ|HZ_[0-9]+|HIGH_RES_TIMERS|CPU_ISOLATION|CPUSETS|IRQ_FORCED_THREADING|RT_GROUP_SCHED|CPU_IDLE|CPU_FREQ|FTRACE|FUNCTION_TRACER|IRQSOFF_TRACER|PREEMPT_TRACER|SCHED_TRACER|TIMERLAT_TRACER|OSNOISE_TRACER|HWLAT_TRACER|TRANSPARENT_HUGEPAGE)[ =]' <config>`.
3. Record each option as `y`, `m`, a value, or `not set`.
4. Decide `preempt_rt` with this table:

| Evidence | `preempt_rt` |
|---|---|
| `CONFIG_PREEMPT_RT=y` in config | true |
| `/sys/kernel/realtime` reads 1 | true |
| `uname -v` contains `PREEMPT_RT` and no config found | true, note config missing |
| `CONFIG_PREEMPT_RT` not set, or only `PREEMPT`/`PREEMPT_DYNAMIC` | false |
| No config found and no `PREEMPT_RT` in `uname -v` | false, note config missing |

5. Set `preempt_model` to the active model string from Phase 1 step 4 if present, else `PREEMPT_RT`, `PREEMPT`, `PREEMPT_VOLUNTARY` or `PREEMPT_NONE` from the config.
6. If `CONFIG_RT_GROUP_SCHED=y`, add a note: real-time tasks inside a cgroup need a nonzero `cpu.rt_runtime_us` for that group or `sched_setscheduler` fails with EPERM. Later flows read this note.

### Output
`config` map, `preempt_rt`, `preempt_model`, `config_source`.

### Quality Gate
- `preempt_rt` is a boolean chosen by a row of the table above, and the row is cited.
- Every option in step 2 has a recorded value or `not set`.

---

## Phase 3: Record CPU Topology And Bootloader

### Entry Criteria
- Phase 2 complete.

### Actions
1. Run `lscpu -e=CPU,CORE,SOCKET,NODE,ONLINE` and record online CPUs.
2. For each CPU, read `/sys/devices/system/cpu/cpuN/topology/thread_siblings_list` and record siblings. Two CPUs on one physical core share execution resources; later isolation steps isolate whole cores.
3. Record `numa_nodes` from `lscpu | grep 'NUMA node(s)'`.
4. Identify the bootloader: `/etc/default/grub` present means grub; `/boot/extlinux/extlinux.conf` present means extlinux (common on NVIDIA Jetson boards); `/boot/firmware/cmdline.txt` means Raspberry Pi firmware; `bootctl status` succeeding means systemd-boot. Record it.
5. Assemble `kernel_report`.

### Output
`kernel_report`.

### Quality Gate
- `cpus` equals the online list from `cat /sys/devices/system/cpu/online` expanded.
- `bootloader` is one of the four values and names the file that proved it.

---

## Worked Example

Illustrative. `target_host` = `ops@ctrl-bench`, an x86_64 control computer on the bench reading vehicle CAN logs.

Phase 1:
```
$ uname -r
6.12.43+deb13-rt-amd64
$ uname -v
#1 SMP PREEMPT_RT Debian 6.12.43-1 (2025-08-27)
$ cat /sys/kernel/realtime
1
```
Phase 2: `config_source` = `/boot/config-6.12.43+deb13-rt-amd64`; `CONFIG_PREEMPT_RT=y`, `CONFIG_NO_HZ_FULL=y`, `CONFIG_HZ_1000=y`, `CONFIG_TIMERLAT_TRACER=y`. Table row 1 applies: `preempt_rt` = true.

Phase 3: 8 CPUs, siblings 0,4 / 1,5 / 2,6 / 3,7, one NUMA node, bootloader grub (`/etc/default/grub`).

---

## Exit Criteria

DONE when `kernel_report` is filled from command output on `target_host`, `preempt_rt` is decided by a cited table row, and topology and bootloader are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | SSH fails | **Stop**: report the ssh error; do not guess the kernel from a package list. |
| Phase 1 | debugfs not mounted | **Adjust**: skip step 4 and record `preempt_model` from the config instead. Do not mount debugfs on a production unit without the owner's approval. |
| Phase 2 | No config file in any location | **Adjust**: decide from `/sys/kernel/realtime` and `uname -v`, and flag `config` as unavailable. |
| Phase 2 | Evidence conflicts (config says RT, uname does not) | **Return**: report both readings; the machine may be booted into a different kernel than the config path suggests. Re-run `uname -r` and match it to the config file name. |
| Phase 3 | CPUs offline | **Adjust**: record them as offline; do not bring them online. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
