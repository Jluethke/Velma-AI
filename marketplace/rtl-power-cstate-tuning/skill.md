# Power State Tuning For Real-Time CPUs

**One-line description:** Limits CPU idle states (C-states) and frequency scaling on the real-time CPUs using PM QoS, cpupower, sysfs or boot parameters, and proves the effect with before and after cyclictest maxima and idle-state residency.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hw_noise_report` (object, required): From `rtl-hw-noise-check`. A hardware floor found there will not move with power tuning.
- `rt_cpus` (string, required): CPU list that will run the control loop, in kernel list format such as `2-3`.

---

## Outputs

- `power_config` (object): The idle states and their exit latencies per RT CPU, the method chosen (PM QoS file descriptor, cpupower, sysfs disable, or boot parameter), the frequency governor set, how it is made persistent, and the measured effect (cyclictest max with `--laptop` before and after).

---

## Phase 1: Inventory Idle And Frequency States

### Entry Criteria
- `rt_cpus` is set.

### Actions
1. Run `cpupower idle-info` (package `linux-cpupower` or `kernel-tools`). Record the driver (`intel_idle`, `acpi_idle`, `psci_idle`, etc.) and each state's name and exit latency.
2. Per CPU, list states from sysfs: `for s in /sys/devices/system/cpu/cpu<N>/cpuidle/state*; do echo "$s $(cat $s/name) latency=$(cat $s/latency) disable=$(cat $s/disable) usage=$(cat $s/usage)"; done`. The `latency` file is the exit latency in microseconds as reported by the driver.
3. Run `cpupower frequency-info` and record the driver and current governor. Also read `/sys/devices/system/cpu/cpu<N>/cpufreq/scaling_governor`.
4. Measure the effect of power management alone: run cyclictest on `rt_cpus` with `--laptop` (cyclictest does not request zero DMA latency) and without it, same duration and settings as the baseline. Record both maxima. Cyclictest without `--laptop` holds `/dev/cpu_dma_latency` at 0, so its result hides C-state exit costs your application would see.

### Output
State inventory and the two cyclictest maxima.

### Quality Gate
- Every idle state on each RT CPU has a recorded name and `latency` value.
- Both cyclictest maxima are recorded with the command lines.

---

## Phase 2: Apply A Limit

### Entry Criteria
- The `--laptop` maximum is larger than the default-run maximum. If they are equal, power states are not a cause; record that and go to Phase 3 for persistence of the governor only.

### Actions
1. Choose the method from this table:

| Situation | Method |
|---|---|
| You control the application source | Open `/dev/cpu_dma_latency`, write a 32-bit integer (microseconds, 0 for the shallowest) and keep the file descriptor open for the process lifetime. The request ends when the fd closes. This is system-wide. |
| Only the RT CPUs should stay shallow | Write `1` to `/sys/devices/system/cpu/cpu<N>/cpuidle/state<K>/disable` for each state K whose `latency` exceeds what the user accepts, on each RT CPU only. |
| Simple, all CPUs | `sudo cpupower idle-set -D <latency_us>` disables every state with exit latency above the value. |
| Must hold from boot, x86 Intel | Boot parameters such as `intel_idle.max_cstate=<n>` and `processor.max_cstate=<n>`. `idle=poll` keeps CPUs spinning and raises heat and power; use only when the user accepts that. |

2. Do not invent the acceptable exit latency. It is the user's choice, bounded by their jitter budget; report the state table and ask if it is not given.
3. Set the frequency governor on RT CPUs to `performance`: `sudo cpupower -c <rt_cpus> frequency-set -g performance`. Frequency changes add latency and change loop execution time.
4. On NVIDIA Jetson boards, power modes are set with `nvpmodel` and clocks pinned with `jetson_clocks`; follow the vendor documentation for your module, and record the mode number used.

### Output
Applied limit and governor.

### Quality Gate
- Re-reading the sysfs `disable` files, or `cpupower idle-info`, shows the intended states disabled on the RT CPUs.
- `cat /sys/devices/system/cpu/cpu<N>/cpufreq/scaling_governor` prints `performance` for each RT CPU.

---

## Phase 3: Verify And Persist

### Entry Criteria
- Phase 2 applied, or Phase 2 skipped with reason recorded.

### Actions
1. Re-run cyclictest with `--laptop` on `rt_cpus`, same settings as Phase 1. Record the maximum.
2. Read state `usage` counters before and after a 60-second run; disabled states must show no increase.
3. Persist: sysfs and cpupower settings are lost on reboot. Use a systemd oneshot unit (`Type=oneshot`, `ExecStart=/usr/bin/cpupower -c <rt_cpus> frequency-set -g performance`, plus `ExecStart=` lines for the sysfs writes via `/bin/sh -c`) enabled with `systemctl enable`, or the `tuned` profile `realtime` or `cpu-partitioning` on RHEL-family systems. Boot parameters persist through the bootloader config.
4. Write `power_config`.

### Output
`power_config`.

### Quality Gate
- The `--laptop` maximum after tuning is recorded next to the before value.
- After a reboot, the governor and disabled states read back as set.

---

## Worked Example

Illustrative. `rt_cpus` = `2-3`, `intel_idle` driver.

Phase 1:
```
$ for s in /sys/devices/system/cpu/cpu2/cpuidle/state*; do echo "$(cat $s/name) $(cat $s/latency)"; done
POLL 0
C1 2
C1E 10
C6 133
```
cyclictest max on CPU 2: 21 us (default), 162 us (`--laptop`).

Phase 2: user accepts states up to C1E. `echo 1 | sudo tee /sys/devices/system/cpu/cpu{2,3}/cpuidle/state3/disable`. Governor set to `performance`.

Phase 3: `--laptop` max now 24 us; C6 `usage` unchanged across 60 s. Persisted with a oneshot unit `rt-power.service`.

---

## Exit Criteria

DONE when the RT CPUs run with the chosen idle limit and `performance` governor, the before and after `--laptop` maxima are recorded, and the settings survive a reboot.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No cpuidle directory | **Adjust**: the platform has no cpuidle driver; record that and skip idle tuning. |
| Phase 2 | User has not set an acceptable exit latency | **Return**: report the state table and ask. Do not pick a C-state for them. |
| Phase 2 | Thermal throttling after `idle=poll` | **Stop**: revert the boot parameter; check `dmesg | grep -i thermal`. |
| Phase 3 | `--laptop` max unchanged after tuning | **Return**: power states are not the cause; hand to `rtl-rtla-timerlat`. |
| Phase 3 | Settings lost after reboot | **Retry**: check `systemctl status rt-power.service` and fix the unit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
