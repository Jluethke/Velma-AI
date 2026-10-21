# Edge Thermal Soak Test

**One-line description:** Runs the deployed inference workload continuously for a user-set soak duration in the deployment power mode and enclosure, logs tegrastats and GPU frequency, and reports throughput drift, peak junction temperature against the device trip points, and every throttle interval.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device, mounted in its real enclosure or as close to it as possible.
- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `power_mode_record` (object, required): Output of `edge-nvpmodel-power-mode`; the soak runs in the deployment mode.
- `thermal_log` (object, required): Output of `edge-tegrastats-thermal-log`; supplies the zone table, trip points and idle baseline.
- `soak_duration_s` (integer, required): Soak length in seconds, a user input sized to reach thermal steady state in the real enclosure.

---

## Outputs

- `soak_report` (object): Throughput per time window, drift from the first to the last window, maximum temperature per sensor versus its passive trip point, throttle intervals with duration, ambient temperature if measured, and the logs used.

---

## Phase 1: Prepare

### Entry Criteria
- The device is in its deployment power mode per `power_mode_record`.

### Actions
1. Record ambient temperature with an independent thermometer if available; otherwise record "ambient not measured".
2. Decide clocks: for a field-realistic soak leave dynamic scaling on (`sudo jetson_clocks --restore <file>` if previously locked); for a throttle-visibility soak lock clocks. Record the choice.
3. Confirm the fan profile in effect (`sudo jetson_clocks --show` prints the fan line on carriers with a fan). Record it.
4. Start tegrastats logging and a 1 s GPU devfreq sampler as in `edge-tegrastats-thermal-log`.

### Output
Logging running under recorded conditions.

### Quality Gate
- tegrastats log is growing (`wc -l` increases between two reads 10 s apart).
- Clock choice and fan profile are recorded.

---

## Phase 2: Soak

### Entry Criteria
- Logging running.

### Actions
1. Run the workload for `soak_duration_s`: `trtexec --loadEngine=model.engine --shapes=<deployment shape> --duration=<soak_duration_s> --useCudaGraph --exportTimes=times.json`, or the deployed application itself with its own frame counter logged once per second. Check `trtexec --help` for `--exportTimes` on your version.
2. Do not touch the device, enclosure or airflow during the run. Record any interruption with its timestamp.
3. Stop tegrastats and the sampler; copy all logs back.

### Output
Soak logs.

### Quality Gate
- The difference between the first and last tegrastats timestamps is at least `soak_duration_s`.
- The tegrastats line count matches the run length divided by the sampling interval, and any missing samples are listed by timestamp.

---

## Phase 3: Analyze

### Entry Criteria
- Logs copied.

### Actions
1. Split the run into windows of a user-set length. Compute throughput per window from `times.json` or the application counter.
2. Drift = (last window throughput minus first window throughput) divided by first window throughput. Report as a percentage.
3. Maximum per sensor from tegrastats; compare each to its zone's passive trip point from `thermal_log`.
4. Throttle intervals: consecutive seconds where GPU frequency is below the value it held in the first window (unlocked) or below the locked value (locked). Record start, end and minimum frequency.
5. Verdict table:

| Observation | Verdict |
|---|---|
| No throttle intervals and all maxima below passive trips | Thermally sustainable in this mode and enclosure |
| Throttle intervals present | Not sustainable at this mode; report drift and intervals |
| Any reading at a `critical` trip or a thermal shutdown | Stop; hardware cooling problem |

6. Assemble `soak_report`.

### Output
`soak_report`.

### Quality Gate
- Drift percentage is computed from logged numbers.
- Every throttle interval has start, end and minimum frequency.

---

## Worked Example

Illustrative only.

Soak 3600 s at 30W, clocks unlocked, enclosure closed.
```
window  qps    gpu_mhz  tj_C
0-300   60.9   1300     58.2
...
3300-3600 52.4 1020     83.7
```
Drift -14.0%. Throttle from 2140 s onward, minimum 1020 MHz. `tj` maximum compared with the passive trip read from sysfs. Verdict: not sustainable at this mode in this enclosure.

---

## Exit Criteria

DONE when the soak ran its full duration and the report gives drift, per-sensor maxima against trip points, throttle intervals and a verdict from the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Not in deployment power mode | **Return**: to `edge-nvpmodel-power-mode`. |
| Phase 2 | Device reboots or shuts down during soak | **Stop**: report a thermal or power fault; check `journalctl -b -1` after reboot. |
| Phase 2 | Run interrupted by the user | **Retry**: restart the full soak; partial soaks do not show steady state. |
| Phase 3 | Steady state not reached (temperature still rising in the last window) | **Retry**: lengthen `soak_duration_s`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
