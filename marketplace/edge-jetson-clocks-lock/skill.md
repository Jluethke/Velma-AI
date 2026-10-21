# Edge jetson_clocks Lock and Restore

**One-line description:** Stores the current dynamic frequency state, pins CPU, GPU and memory clocks to the maximum allowed by the active power mode with jetson_clocks for repeatable benchmarking, records the pinned frequencies from sysfs, and documents the exact restore command.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `power_mode_record` (object, required): Output of `edge-nvpmodel-power-mode`; clocks are only meaningful inside a known mode.

---

## Outputs

- `clock_state` (object): Path of the stored pre-lock state file, `jetson_clocks --show` output before and after, GPU and EMC current frequencies read from sysfs after locking, and the restore command.

---

## Phase 1: Store the Current State

### Entry Criteria
- `power_mode_record` shows the active mode.

### Actions
1. Run `ssh <device_host> sudo jetson_clocks --show > clocks_before.txt`. Keep it.
2. Run `ssh <device_host> sudo jetson_clocks --store /home/<user>/l4t_dfs_before.conf`. Without a path, `--store` writes a default file in the invoking user's home; pass a path so the restore target is unambiguous.
3. Confirm the file exists and is non-empty with `ls -l`.

Do NOT: run `jetson_clocks` before storing. Once locked, the original governor settings cannot be read back.

### Output
Stored state file.

### Quality Gate
- The store file exists and has non-zero size.
- `clocks_before.txt` lists CPU, GPU and EMC lines.

---

## Phase 2: Lock Clocks

### Entry Criteria
- State stored.

### Actions
1. Decide whether to lock:

| Purpose of the next step | Lock clocks? |
|---|---|
| Repeatable micro-benchmark or A/B comparison of engines | Yes |
| Measuring field behavior under dynamic frequency scaling | No; skip to Phase 3 and record "unlocked" |
| Thermal soak test meant to show throttling | Yes, so throttling shows as a frequency drop below the locked value |

2. Run `ssh <device_host> sudo jetson_clocks`.
3. Run `ssh <device_host> sudo jetson_clocks --show > clocks_after.txt`. For each CPU line, `MinFreq` should equal `MaxFreq` equal `CurrentFreq`.
4. Read the GPU frequency from devfreq: `ssh <device_host> 'for d in /sys/class/devfreq/*; do echo $d $(cat $d/cur_freq) $(cat $d/max_freq); done'`. The GPU node name contains `gpu` or an address such as `17000000.ga10b`; identify it from the `--show` output rather than guessing.
5. Fan: `jetson_clocks` also sets the fan to maximum on supported carriers. Record the fan line from `--show`.

### Output
Locked clocks with recorded frequencies.

### Quality Gate
- In `clocks_after.txt` every CPU line has `MinFreq` equal to `MaxFreq`.
- GPU devfreq `cur_freq` equals its `max_freq`.

---

## Phase 3: Record the Restore Path

### Entry Criteria
- Lock decision applied.

### Actions
1. Write the restore command into `clock_state`: `sudo jetson_clocks --restore /home/<user>/l4t_dfs_before.conf`.
2. Note that `jetson_clocks` does not persist across reboot; a reboot also restores dynamic scaling.
3. Assemble `clock_state` with locked or unlocked status.

### Output
`clock_state`.

### Quality Gate
- `clock_state` contains a restore command naming an existing file.
- `clock_state` states locked or unlocked explicitly.

---

## Worked Example

Illustrative only.

```
$ sudo jetson_clocks --store /home/nvidia/l4t_dfs_before.conf
$ sudo jetson_clocks
$ sudo jetson_clocks --show
SOC family:tegra234  Machine:NVIDIA Jetson AGX Orin Developer Kit
Online CPUs: 0-11
cpu0: Online=1 Governor=schedutil MinFreq=2201600 MaxFreq=2201600 CurrentFreq=2201600 ...
GPU MinFreq=1300500000 MaxFreq=1300500000 CurrentFreq=1300500000
EMC MinFreq=204000000 MaxFreq=3199000000 CurrentFreq=3199000000 FreqOverride=1
NV Power Mode: MAXN
```
`clock_state`: locked, restore with `sudo jetson_clocks --restore /home/nvidia/l4t_dfs_before.conf`.

---

## Exit Criteria

DONE when clocks are locked (or explicitly left unlocked) with frequencies recorded and a tested restore path documented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--store` fails with permission error | **Adjust**: write to a path the root user can write, then retry. |
| Phase 2 | GPU `cur_freq` below `max_freq` right after locking | **Retry**: read again after 5 seconds; if still low, check thermal zones with `edge-tegrastats-thermal-log` before benchmarking. |
| Phase 2 | Power mode changed after locking | **Return**: rerun this flow; locks belong to the mode they were taken in. |
| Phase 3 | Restore file deleted | **Adjust**: reboot to restore dynamic scaling, with the user's approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
