# Hardware Noise Check

**One-line description:** Measures latency that the operating system cannot remove (System Management Interrupts, NMIs, firmware and platform stalls) with hwlatdetect, rtla hwnoise and rtla osnoise, so later tuning is not blamed for a floor set by the hardware.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kernel_report` (object, required): From `rtl-kernel-rt-check`. Supplies `arch`, `cpus`, and whether `CONFIG_HWLAT_TRACER` and `CONFIG_OSNOISE_TRACER` are set.
- `test_duration` (string, required): Length of each measurement, for example `10m`. User choice.

---

## Outputs

- `hw_noise_report` (object): `hwlat_max_us` and sample count from hwlatdetect or rtla hwnoise, `smi_count_delta` (x86 only, from turbostat), `osnoise_per_cpu` (max noise, max single, HW, NMI, IRQ, Softirq, Thread counts per CPU), `verdict` (`hardware_floor_found` or `no_hardware_floor_found`), and the commands used.

---

## Phase 1: Hardware Latency Detector

### Entry Criteria
- `kernel_report.config.CONFIG_HWLAT_TRACER` is `y`, or `rtla` is installed.
- Nothing time-critical is running: the hwlat tracer spins a CPU with interrupts disabled for its sampling width, which itself disturbs other work. On a vehicle computer run it parked with actuator outputs disabled, or on the bench.

### Actions
1. Prefer `rtla hwnoise` if present (`rtla hwnoise --help`). Run: `sudo rtla hwnoise -c <cpu-list> -d <test_duration>`. It reports per CPU the noise observed with interrupts disabled, which can only come from hardware, firmware or NMIs.
2. Otherwise use hwlatdetect from rt-tests: `sudo hwlatdetect --duration=<seconds> --threshold=<us>`. Check `hwlatdetect --help` for the units your version expects. The threshold is the smallest gap that is reported; set it at or below the latency budget the user cares about.
3. Read the output: hwlatdetect prints `Samples recorded:` and `Max Latency:`; each sample line shows the inner and outer gap in microseconds. Record the maximum and the count.

### Output
`hwlat_max_us` and sample count.

### Quality Gate
- The command line and its final summary lines are saved verbatim.
- `hwlat_max_us` is a number read from the output or `0 samples`.

---

## Phase 2: SMI Count (x86 Only)

### Entry Criteria
- `kernel_report.arch` is `x86_64`. On arm64, skip to Phase 3 and record `smi_count_delta` as `not applicable`.

### Actions
1. Install `turbostat` (package `linux-tools-common` plus `linux-tools-$(uname -r)` on Ubuntu, `linux-cpupower` or `linux-tools` on others; check your distro).
2. Run `sudo turbostat --quiet --show SMI,CPU,Busy%,Bzy_MHz --interval 10 --num_iterations <n>` while a cyclictest or your loop runs on the RT CPUs. Confirm column names with `turbostat --list` if the run rejects one.
3. The `SMI` column is the count of System Management Interrupts per interval. A nonzero count that coincides with latency spikes points at firmware. SMIs cannot be masked by Linux; mitigation is BIOS settings (vendor specific, for example disabling legacy USB emulation or certain power-management features) or different hardware.
4. Alternative without turbostat: `sudo modprobe msr; sudo rdmsr -a 0x34` before and after a run (MSR_SMI_COUNT on Intel). Record the delta per CPU.

### Output
`smi_count_delta`.

### Quality Gate
- `smi_count_delta` is a number per interval or per run, read from turbostat or rdmsr output.

---

## Phase 3: OS Noise Per CPU

### Entry Criteria
- `kernel_report.config.CONFIG_OSNOISE_TRACER` is `y` and `rtla` is installed (`sudo apt install rtla` or the `rtla` package on your distro, or built from `tools/tracing/rtla` in the kernel tree).

### Actions
1. Run `sudo rtla osnoise top -c <cpu-list> -d <test_duration>`. Check `rtla osnoise top --help` for the priority option if you want the measuring thread at a real-time priority.
2. Read columns per CPU: `RUNTIME` (measurement time), `Noise` (total time stolen), `% CPU Aval` (share left for the workload), `Max Noise`, `Max Single` (largest single interruption), and counters `HW`, `NMI`, `IRQ`, `Softirq`, `Thread`.
3. Interpret with this table:

| Pattern | Meaning |
|---|---|
| `HW` count > 0 | Noise with no OS cause: firmware, SMI, or hardware |
| `NMI` count > 0 | NMIs (perf counters, watchdog). Check `cat /proc/sys/kernel/nmi_watchdog` |
| High `IRQ` on an RT CPU | Interrupts not moved off; see `rtl-irq-affinity` |
| High `Thread` on an RT CPU | Other threads scheduled there; see `rtl-cpu-isolation-bootargs` |
| High `Softirq` | Network or timer softirq work on that CPU |

4. Set `verdict` = `hardware_floor_found` if Phase 1 reported samples or Phase 2 showed SMIs or `HW` > 0 on any CPU; otherwise `no_hardware_floor_found`.

### Output
`hw_noise_report`.

### Quality Gate
- `osnoise_per_cpu` has one row per measured CPU copied from the tool output.
- `verdict` is derived by the rule in step 4, and the triggering number is cited.

---

## Worked Example

Illustrative. x86_64, CPUs 2-3 to be real-time, `test_duration` = `10m`.

```
$ sudo rtla hwnoise -c 2-3 -d 10m
                                          Hardware-related Noise
duration:   0 00:10:00 | time is in us
CPU Period       Runtime        Noise  % CPU Aval   Max Noise   Max Single          HW          NMI
  2 #599     599000000          174   99.99997          14           14           2            0
  3 #599     599000000            0  100.00000           0            0           0            0
$ sudo turbostat --quiet --show CPU,SMI --interval 10 --num_iterations 6
CPU   SMI
-     2
```
`verdict` = `hardware_floor_found`: CPU 2 shows `HW` = 2 and a 14 us single event, and turbostat counted SMIs. The user is told that 14 us on CPU 2 is a platform floor; tuning cannot go below it there.

---

## Exit Criteria

DONE when hardware latency, SMI counts (x86) and per-CPU OS noise are recorded from tool output and a verdict is derived by rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Neither rtla nor hwlatdetect available | **Adjust**: use the hwlat tracer directly: `echo hwlat > /sys/kernel/tracing/current_tracer`, read `/sys/kernel/tracing/trace`, then `echo nop > /sys/kernel/tracing/current_tracer`. |
| Phase 1 | Tracer not in kernel config | **Return**: report it; the kernel needs `CONFIG_HWLAT_TRACER`. |
| Phase 2 | turbostat lacks SMI column | **Adjust**: use the rdmsr method. |
| Phase 3 | `rtla: command not found` | **Adjust**: install the rtla package or build it from the kernel tree matching `uname -r`. |
| Phase 3 | NMI counts from the watchdog | **Return**: report it; disabling `kernel.nmi_watchdog` is the owner's choice, since it removes lockup detection. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
