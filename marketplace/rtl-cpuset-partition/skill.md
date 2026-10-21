# Cpuset Partition With cgroup v2 And systemd

**One-line description:** Confines system services, user sessions and kernel-unbound work to the housekeeping CPUs with systemd `AllowedCPUs` and a cgroup v2 cpuset partition, so only the control process runs on the real-time CPUs, without needing a reboot to change the split.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isolation_config` (object, required): From `rtl-cpu-isolation-bootargs`. Tells whether `isolcpus` is already active.
- `rt_cpus` (string, required): CPUs for the control loop.
- `housekeeping_cpus` (string, required): CPUs for everything else.

---

## Outputs

- `cpuset_config` (object): The slice settings applied, the partition cgroup path and its `cpuset.cpus.partition` reading, the workqueue cpumask, and the check that no stray tasks run on `rt_cpus`.

---

## Phase 1: Confirm cgroup v2 And Controllers

### Entry Criteria
- `rt_cpus` and `housekeeping_cpus` are set and do not overlap.

### Actions
1. `stat -fc %T /sys/fs/cgroup` must print `cgroup2fs`. If it prints `tmpfs`, the system uses cgroup v1 or hybrid; record that and use the v1 notes in Error Handling.
2. `cat /sys/fs/cgroup/cgroup.controllers` must include `cpuset`.
3. `systemctl --version | head -1`. `AllowedCPUs=` requires a systemd version that supports it; check `man systemd.resource-control` on the machine.

### Output
cgroup version and controller availability.

### Quality Gate
- The outputs of steps 1 and 2 are recorded verbatim.

---

## Phase 2: Move Everything Else To Housekeeping CPUs

### Entry Criteria
- cgroup v2 with `cpuset` available.

### Actions
1. Restrict the three top-level slices at runtime first, so a mistake is undone by a reboot:
   `sudo systemctl set-property --runtime system.slice AllowedCPUs=<housekeeping_cpus>`
   `sudo systemctl set-property --runtime user.slice AllowedCPUs=<housekeeping_cpus>`
   `sudo systemctl set-property --runtime init.scope AllowedCPUs=<housekeeping_cpus>`
2. Move unbound kernel workqueues: `echo <housekeeping mask in hex> | sudo tee /sys/devices/virtual/workqueue/cpumask`. Compute the hex mask from `housekeeping_cpus` (CPUs 0-1 is `3`, CPUs 0-3 is `f`). Read it back.
3. Create a slice for the control process, for example `/etc/systemd/system/rt.slice` with `[Slice]` and `AllowedCPUs=<rt_cpus>`. The control service later uses `Slice=rt.slice` and `CPUAffinity=<rt_cpus>` (see `rtl-sched-fifo-chrt`).
4. Optional exclusive partition (kernel support for `cpuset.cpus.partition` values `root` and `isolated` depends on version; read `Documentation/admin-guide/cgroup-v2.rst` for your kernel): after the slice exists and the service has started once, `echo isolated | sudo tee /sys/fs/cgroup/rt.slice/cpuset.cpus.partition`, then read it back. A reading of `isolated` means accepted; a reading like `isolated invalid (...)` names the reason it was rejected.
5. When the split is proven (Phase 3), make it persistent by repeating step 1 without `--runtime`.

### Output
Applied slice restrictions, workqueue mask, and rt.slice.

### Quality Gate
- `systemctl show system.slice -p AllowedCPUs` prints the housekeeping list, and the same for `user.slice` and `init.scope`.
- `cat /sys/devices/virtual/workqueue/cpumask` prints the intended mask.
- If step 4 was done, `cat /sys/fs/cgroup/rt.slice/cpuset.cpus.partition` prints exactly `isolated` or `root`.

---

## Phase 3: Verify No Stray Tasks

### Entry Criteria
- Phase 2 applied.

### Actions
1. List tasks currently on RT CPUs: `ps -eLo pid,tid,psr,cls,rtprio,comm | awk 'NR==1 || $3 ~ /^(2|3)$/'` (replace the regex with your RT CPU ids).
2. Classify each with this table:

| Task | Expected on RT CPU? |
|---|---|
| `migration/N`, `cpuhp/N`, `ksoftirqd/N`, `ktimers/N`, `rcuc/N`, `kworker/N:*` (per-CPU, N in rt_cpus) | Yes, per-CPU kernel threads |
| `irq/NN-*` for the loop's own devices | Yes, if placed there on purpose by `rtl-irq-affinity` |
| Any user process other than the control process | No: find its cgroup with `cat /proc/<pid>/cgroup` |
| Unbound `kworker/u*` | No: check the workqueue mask |

3. For each "No" entry, record its cgroup and fix the slice it belongs to. Do not kill system processes to clear the list.

### Output
`cpuset_config`.

### Quality Gate
- The task list from step 1 is saved and every entry has a classification from the table.
- Zero unexplained user processes remain on `rt_cpus`.

---

## Worked Example

Illustrative. `rt_cpus` = `2-3`, `housekeeping_cpus` = `0-1`.

```
$ stat -fc %T /sys/fs/cgroup
cgroup2fs
$ sudo systemctl set-property --runtime system.slice AllowedCPUs=0-1
$ sudo systemctl set-property --runtime user.slice AllowedCPUs=0-1
$ sudo systemctl set-property --runtime init.scope AllowedCPUs=0-1
$ echo 3 | sudo tee /sys/devices/virtual/workqueue/cpumask
3
$ ps -eLo pid,tid,psr,cls,rtprio,comm | awk 'NR==1 || $3 ~ /^(2|3)$/'
  PID   TID PSR CLS RTPRIO COMMAND
   27    27   2  FF     99 migration/2
   30    30   2  FF      1 ktimers/2
   31    31   2  TS      - ksoftirqd/2
 1440  1440   3  TS      - chromium
```
`chromium` is a "No" entry; its cgroup is `user.slice/...`, which was started before the change. It is restarted and returns on CPU 0-1.

---

## Exit Criteria

DONE when system, user and init slices are restricted to housekeeping CPUs, the workqueue mask matches, rt.slice exists, and no unexplained task runs on the RT CPUs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | cgroup v1 or hybrid | **Adjust**: use systemd `CPUAffinity=` in `/etc/systemd/system.conf` for the housekeeping list and reboot; document that partitions are unavailable. |
| Phase 2 | `AllowedCPUs` unknown property | **Adjust**: systemd too old; use `CPUAffinity=` in `system.conf`. |
| Phase 2 | Partition reads `invalid` | **Return**: report the reason text; the parent cgroup usually lacks exclusive CPUs. Keep the non-partition setup. |
| Phase 3 | Processes keep appearing on RT CPUs | **Retry**: they were started from a scope outside the restricted slices; find the scope via `/proc/<pid>/cgroup` and restrict it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
