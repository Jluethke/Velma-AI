# Edge Unified Memory Budget

**One-line description:** Measures how much of the shared CPU and GPU DRAM a Jetson deployment really consumes, accounts for zram swap and carve-outs, sets the TensorRT builder workspace and container memory limits from measured numbers, and verifies an out-of-memory event is visible in the kernel log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.
- `container_run_spec` (object, required): Output of `edge-container-nvidia-runtime`; supplies the run command that is measured.

---

## Outputs

- `memory_budget` (object): Total and available DRAM, swap and zram configuration, idle baseline, measured peak during the workload, the chosen TensorRT workspace limit, the container `--memory` value if used, and how an out-of-memory kill appears in `dmesg`.

---

## Phase 1: Read the Memory Layout

### Entry Criteria
- `platform_report` exists.

### Actions
1. Run `ssh <device_host> free -m` and `ssh <device_host> "grep -E 'MemTotal|MemAvailable|CmaTotal|CmaFree' /proc/meminfo"`. Record values.
2. Understand the model: on Jetson the integrated GPU has no separate VRAM. CUDA allocations, TensorRT engines, the CPU process heap and the page cache all draw from the same DRAM. `cudaMemGetInfo` reports free memory of that shared pool.
3. Run `ssh <device_host> "zramctl; swapon --show; systemctl is-enabled nvzramconfig 2>/dev/null"`. Record zram devices and whether NVIDIA's `nvzramconfig` service creates them.
4. Record the policy: GPU allocations cannot be swapped out, so zram helps only CPU-side memory. Do not count swap as GPU headroom.

### Output
Memory layout table.

### Quality Gate
- `MemTotal`, `MemAvailable` and swap totals are recorded.
- Whether zram is active is stated as yes or no from `zramctl`.

---

## Phase 2: Measure the Real Peak

### Entry Criteria
- Layout recorded.

### Actions
1. Drop nothing and stop nothing the user did not approve. Record idle system RAM used from one tegrastats line: `sudo tegrastats --interval 1000` for 10 samples, take the median `RAM <used>` value.
2. Start tegrastats logging (see `edge-tegrastats-thermal-log`), start the workload with the command from `container_run_spec`, run it through engine load and at least one full inference loop at the deployment batch size.
3. Peak usage = maximum `RAM <used>` during the run minus the idle median.
4. Measure with the system-wide RAM value, not the process RSS. GPU buffers allocated through the NVIDIA driver may not appear in `ps` RSS or `/usr/bin/time -v` maximum resident set size.

### Output
Measured peak in MB.

### Quality Gate
- The idle median and run maximum both come from tegrastats lines in a saved log.
- Peak is reported in MB with the log file name.

---

## Phase 3: Set Limits

### Entry Criteria
- Peak measured.

### Actions
1. TensorRT builder workspace: set `--memPoolSize=workspace:<size>` for trtexec or `config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, <bytes>)` in Python. Check `trtexec --help` for the unit and suffixes your TensorRT version accepts. Choose a size the device can hold at build time with the measured idle usage; it is a build-time cap and also bounds tactic choice, so record it for `edge-trtexec-engine-build`.
2. Container limit: if a `--memory` limit is wanted, set it at or above the measured peak plus the margin the user specifies. Then test it (step 3), because whether driver-allocated GPU memory is charged to the container's cgroup depends on the kernel and driver; verify instead of assuming.
3. Test: run the workload under the limit. Read `dmesg | grep -i -E 'oom|killed process|nvmap'` afterward. Record what an out-of-memory event looks like on this device (OOM killer line, or an allocation failure from the CUDA runtime in the app log).
4. Assemble `memory_budget`.

Do NOT: disable zram or change `vm.*` sysctls as part of this flow. Those are system policy decisions for the user.

### Output
`memory_budget`.

### Quality Gate
- The workload completes one full loop under the chosen limit with no OOM line in `dmesg`.
- `memory_budget` names the workspace size and its unit as accepted by `trtexec --help`.

---

## Worked Example

Illustrative only.

```
$ free -m
               total        used        free      shared  buff/cache   available
Mem:           30536        2210       25810          40        2516       27900
Swap:          15268           0       15268
$ zramctl
NAME       ALGORITHM DISKSIZE DATA COMPR TOTAL STREAMS MOUNTPOINT
/dev/zram0 lz4           1.2G   4K   74B   12K      12 [SWAP]
```
Idle median RAM 2210 MB, run maximum 5830 MB, peak 3620 MB. Workspace set to the value the user approved; container limit tested with no OOM.

---

## Exit Criteria

DONE when `memory_budget` holds a measured peak from tegrastats, a workspace size for the engine build, and a tested container limit (or an explicit "no container limit").

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Workload killed before the first loop | **Return**: report the device cannot hold this model at this batch size; reduce batch or precision upstream. |
| Phase 2 | RAM still rising at the end of the run | **Retry**: run longer; a steady climb suggests a leak that must be reported, not budgeted. |
| Phase 3 | Limit triggers OOM | **Adjust**: raise the limit by the user's margin and retest. |
| Phase 3 | GPU memory not charged to cgroup | **Adjust**: record that `--memory` does not cap GPU allocations on this device and rely on the measured peak. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
