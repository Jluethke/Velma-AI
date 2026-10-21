# Sim-to-Real Gap Check on a Matched Maneuver

**One-line description:** Compares a simulated run with a real logged run of the same maneuver signal by signal: resamples to a common time base, removes time offset by cross-correlation, and reports residual error and distribution differences per signal so the simulator's fidelity is measured instead of assumed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sim_log` (string, required): CSV or bag from the simulator for the maneuver, driven by the same input profile as the real run (for example the real run's recorded speed and steering profile replayed as simulator commands).
- `real_log` (string, required): Log from the real vehicle recorded read-only (sensor and bus logging only) on a vehicle the user owns. The maneuver was driven by a human driver on a closed course; this flow only reads the log.
- `signal_list` (object[], required): Signals to compare, each with the sim column or topic, the real column or topic, unit, and an optional tolerance with its source (requirement, sensor datasheet accuracy, or owner decision).

---

## Outputs

- `gap_report` (object[]): Per signal: time offset removed, sample count, mean error (bias), RMSE, max absolute error and its time, two-sample Kolmogorov-Smirnov statistic and p-value for the residual-free signal distributions where meaningful, tolerance and result (WITHIN / OUTSIDE / NOT JUDGED).

---

## Phase 1: Align

### Entry Criteria
- Both logs cover the same maneuver; units of every signal are known.

### Actions
1. Convert both logs to tables of time (s) and the listed signals in SI units. Use sensor timestamps (header stamps or CAN log timestamps), not file write times.
2. Choose the common rate as the lower of the two native rates for that signal; resample the faster one with linear interpolation (`numpy.interp`). Do not upsample the slower one.
3. Trim both to the overlapping maneuver window defined by an event in the data (for example speed crossing a stated value at maneuver start), recorded in the report.
4. Estimate time offset per signal with cross-correlation of mean-removed signals: `scipy.signal.correlate(a, b, mode='full')` with `scipy.signal.correlation_lags(len(a), len(b), mode='full')`; the lag at the maximum is the offset in samples. Shift and record the offset in seconds.
5. If offsets differ widely between signals, the logs have a clock problem; use one reference signal's offset for all and record the spread.

### Output
Aligned signal pairs and offsets.

### Quality Gate
- Every pair has equal length and identical time vectors after alignment.
- The offset for each signal is recorded.

---

## Phase 2: Measure the Gap

### Entry Criteria
- Alignment complete.

### Actions
1. Residual r = sim - real per sample. Compute bias = mean(r), RMSE = sqrt(mean(r^2)), max |r| and its time.
2. For noise-like signals (IMU at rest, GNSS jitter), compare distributions with `scipy.stats.ks_2samp(sim, real)` on segments where the vehicle state is steady. Report statistic and p-value; note that a KS test assumes independent samples, which time series violate, so treat it as descriptive.
3. For dynamic signals (speed, yaw rate, lateral acceleration), plot sim and real on one axis with residual below; save the PNG next to the report.
4. Separate causes with this table:

| Pattern | Likely cause | Check |
|---|---|---|
| Constant bias | Calibration or mounting offset | Sensor pose and bias in the sim model |
| Error grows with speed | Tire or drag model | Plant parameters vs measured coastdown |
| Error at transients only | Actuator lag or bandwidth not modeled | Add measured actuator delay to the model |
| Real noise larger than sim | Sim noise too low | Revisit `vsim-gz-sensor-noise` derivation |
| Phase lag after alignment | Different filtering in the two pipelines | Compare filter settings |

### Output
Per-signal metrics and plots.

### Quality Gate
- Every signal has bias, RMSE and max error with time.
- A plot file exists for every dynamic signal.

---

## Phase 3: Judge and Report

### Entry Criteria
- Metrics computed.

### Actions
1. For each signal with a tolerance in `signal_list`, compare the stated metric (the tolerance must say which metric: RMSE, max, or bias). Without a tolerance: NOT JUDGED.
2. Do not invent tolerances. Do not drop the worst segment to get WITHIN; any trimming is the Phase 1 window only.
3. Write `gap_report` with the alignment window, offsets, metrics, results, and for each OUTSIDE signal the likely cause from the table.
4. State the scope: one maneuver, one vehicle, one condition. Fidelity outside these is not shown by this report.

### Output
`gap_report`.

### Quality Gate
- Every judged signal names the metric and tolerance source.
- The scope statement is present.

---

## Worked Example

Illustrative. Constant-radius turn, signals speed, yaw rate, lateral acceleration. Real log from read-only IMU and wheel speed logging.
```
signal,offset_s,bias,rmse,max_abs,t_max,tolerance,metric,source,result
speed_mps,0.08,0.03,0.11,0.35,12.4,0.2,rmse,owner decision OD-3,WITHIN
yaw_rate_rps,0.10,0.004,0.021,0.066,8.1,,,,NOT JUDGED
lat_acc_mps2,0.10,-0.21,0.38,1.02,8.0,0.3,rmse,SRD-7 2.2,OUTSIDE
```
Lateral acceleration OUTSIDE with error at transients: likely missing tire relaxation; check the tire model.

---

## Exit Criteria

DONE when every listed signal is aligned, measured, judged against a sourced tolerance or marked NOT JUDGED, and the report states its scope.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Real log came from active commands to the vehicle | **Stop**: this flow uses read-only logs of human-driven closed-course runs only. |
| Phase 1 | Offsets inconsistent across signals | **Adjust**: use one reference offset and report the spread. |
| Phase 2 | Units differ | **Adjust**: convert to SI and rerun. |
| Phase 3 | No tolerance for a signal | **Return**: report NOT JUDGED and list it for the owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
