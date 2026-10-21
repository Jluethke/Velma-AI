# Edge tegrastats Thermal and Power Log

**One-line description:** Captures a timestamped tegrastats log alongside the kernel thermal zones and their trip points, parses RAM, CPU, GPU load, temperature and power-rail fields, and flags throttling by comparing live GPU frequency against the locked value.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `clock_state` (object, required): Output of `edge-jetson-clocks-lock`; supplies the expected GPU frequency.
- `log_duration_s` (integer, required): How long to log, in seconds. A user input; choose it to cover the workload being observed.

---

## Outputs

- `thermal_log` (object): Path of the raw tegrastats log, a parsed per-sample table (time, RAM used, CPU loads, GPU load, each temperature sensor, each power rail), thermal zone names with trip points, the maximum of each temperature, and a list of samples where GPU frequency fell below the locked value.

---

## Phase 1: Map Thermal Zones and Trip Points

### Entry Criteria
- `clock_state` exists.

### Actions
1. Run `ssh <device_host> 'for z in /sys/class/thermal/thermal_zone*; do echo $z $(cat $z/type) $(cat $z/temp); done'`. `temp` is in millidegrees Celsius; divide by 1000.
2. For each zone, read its trip points: `ssh <device_host> 'for t in /sys/class/thermal/thermal_zone0/trip_point_*_temp; do echo $t $(cat $t) $(cat ${t%_temp}_type); done'` (repeat per zone). Record type (`passive`, `active`, `hot`, `critical`) and temperature.
3. These trip points are the device's own documented thresholds. Use them; do not invent a temperature limit.

### Output
Zone table with trip points.

### Quality Gate
- Every `thermal_zone*` directory has a row with name, current temperature and trip points.
- No temperature limit in the output comes from anywhere but a trip point file.

---

## Phase 2: Capture the Log

### Entry Criteria
- Zone table exists.

### Actions
1. Start logging: `ssh <device_host> sudo tegrastats --interval 1000 --logfile /tmp/tegrastats.log --start`. `--interval` is in milliseconds.
2. In parallel, sample the GPU frequency once per second from the devfreq node identified in `clock_state`: `ssh <device_host> 'for i in $(seq <log_duration_s>); do echo $(date +%s) $(cat /sys/class/devfreq/<gpu node>/cur_freq); sleep 1; done' > gpu_freq.log`.
3. Run the workload being observed for `log_duration_s`.
4. Stop logging: `ssh <device_host> sudo tegrastats --stop`, then copy `/tmp/tegrastats.log` back with `scp`.

Do NOT: run two tegrastats instances at once; the second may fail or interleave output.

### Output
Raw `tegrastats.log` and `gpu_freq.log`.

### Quality Gate
- Line count of `tegrastats.log` is within one or two of `log_duration_s` at a 1000 ms interval.
- `gpu_freq.log` has one line per second.

---

## Phase 3: Parse and Flag

### Entry Criteria
- Logs copied.

### Actions
1. Parse each tegrastats line. Field names vary by module and release; read them from the file, do not assume. Typical tokens:
   - `RAM <used>/<total>MB` and `SWAP <used>/<total>MB`.
   - `CPU [<load>%@<MHz>,...]`; `off` means a core is offline.
   - `GR3D_FREQ <load>%` (GPU load; some releases append `@[<MHz>]`).
   - `<sensor>@<temp>C` such as `cpu@`, `gpu@`, `tj@`.
   - Rails such as `VDD_IN <instant>mW/<average>mW`.
2. Record the maximum of every temperature token and compare each with the matching zone's lowest `passive` trip point.
3. Mark every second where `gpu_freq.log` is below the locked GPU frequency in `clock_state` as a throttle sample.
4. Assemble `thermal_log`.

### Output
`thermal_log`.

### Quality Gate
- `thermal_log` lists the maximum temperature per sensor and the passive trip point it was compared with.
- The throttle sample list is present (empty list when none).

---

## Worked Example

Illustrative only.

```
$ sudo tegrastats --interval 1000 --logfile /tmp/tegrastats.log --start
$ head -1 /tmp/tegrastats.log
10-21-2026 14:02:11 RAM 6120/30536MB (lfb 4x4MB) SWAP 0/15268MB (cached 0MB) CPU [41%@2201,38%@2201,...] GR3D_FREQ 97% cpu@58.1C soc2@55.7C gpu@60.4C tj@61.0C VDD_GPU_SOC 9120mW/8900mW VDD_CPU_CV 2400mW/2380mW VIN_SYS_5V0 5200mW/5150mW
```
Result: `tj` peak 61.0 C against a passive trip of the value read from sysfs; zero throttle samples.

---

## Exit Criteria

DONE when `thermal_log` holds the parsed samples, per-sensor maxima compared with real trip points, and an explicit throttle sample list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Trip point files absent for a zone | **Adjust**: record "no trip points exposed" for that zone; do not substitute a number. |
| Phase 2 | `tegrastats --start` not supported on this release | **Adjust**: run `sudo tegrastats --interval 1000 > /tmp/tegrastats.log &` and stop it with `kill`. |
| Phase 3 | Unknown token format | **Adjust**: record the raw token and its position; extend the parser for that token only. |
| Phase 3 | Temperature at or above a passive trip | **Return**: report thermal headroom as exhausted; benchmarks from this window are not valid steady-state numbers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
