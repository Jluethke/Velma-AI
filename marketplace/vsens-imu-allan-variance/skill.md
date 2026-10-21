# IMU Noise Characterization with Allan Deviation

**One-line description:** Computes the overlapping Allan deviation of a long static IMU log with the allantools Python package and reads white noise density, bias instability and random walk off the slope lines per IEEE Std 952 Annex C, then writes them in the Kalibr imu.yaml form.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `imu_stream_report` (object, required): From `vsens-imu-driver-bringup`; gives the rate, units, axis map and device timestamp source.
- `static_log_path` (string, required): A log of the IMU sitting still on a vibration-isolated surface, in SI units, with device timestamps, recorded for a duration the user chose. The duration bounds the longest tau you can read.

---

## Outputs

- `imu_noise_params` (object): Per axis and averaged: gyroscope_noise_density (rad/s/sqrt(Hz)), gyroscope_random_walk (rad/s^2/sqrt(Hz)), accelerometer_noise_density (m/s^2/sqrt(Hz)), accelerometer_random_walk (m/s^3/sqrt(Hz)), bias instability per sensor, update_rate, the tau ranges each value was read from, and the plot file paths.

---

## Phase 1: Check the Log

### Entry Criteria
- `python3 -c "import allantools, numpy, matplotlib"` succeeds (`pip install allantools`).
- The log was recorded after the IMU reached thermal steady state; the user states the warm-up time used.

### Actions
1. Load the log with `numpy.loadtxt` or `numpy.genfromtxt`. Columns: device time, gx, gy, gz, ax, ay, az.
2. Compute `dt = numpy.diff(t)`. Count intervals greater than 1.5 x median. Allan deviation assumes uniform sampling; gaps bias the long-tau end.
3. If gaps exist, cut the log into the longest gap-free segment and use that segment only. Do not interpolate across gaps.
4. Record the segment duration T. The longest usable tau is a fraction of T because few clusters remain; allantools reports error bars, read them in Phase 2.

### Output
Gap-free segment, its duration T, and the sample rate fs = 1 / median(dt).

### Quality Gate
- Zero intervals above 1.5 x median in the chosen segment, printed.
- fs equals the configured rate in `imu_stream_report`.

---

## Phase 2: Compute Allan Deviation

### Entry Criteria
- Gap-free segment ready.

### Actions
1. For each of six channels, run `taus, adev, adev_err, n = allantools.oadev(x, rate=fs, data_type="freq", taus="octave")`. Gyro data are rates and accelerometer data are specific force; both are "freq" type here (rate-like samples, not integrated phase).
2. Plot on log-log axes, one figure per sensor (gyro, accel), three axes each, with error bars. Save `adev_gyro.png` and `adev_accel.png`.
3. Draw reference lines of slope -1/2 and +1/2 on each plot.

### Output
Allan deviation arrays and two plots.

### Quality Gate
- Both PNG files exist.
- The short-tau part of each curve falls with slope close to -1/2 on the plot; if it does not, record the observed slope.

---

## Phase 3: Read Coefficients and Write imu.yaml

### Entry Criteria
- Plots exist.

### Actions
1. White noise (angle or velocity random walk) N: fit a line of slope -1/2 to the region where the curve has that slope; N is that line's value at tau = 1 s (IEEE Std 952 Annex C). Units: rad/s/sqrt(Hz) for gyro, m/s^2/sqrt(Hz) for accel. This is Kalibr's `*_noise_density`.
2. Bias instability B: take the minimum of the curve; B = min / 0.664, where 0.664 = sqrt(2 ln 2 / pi) from the same Annex.
3. Rate random walk K: fit a line of slope +1/2 where present; K is its value at tau = 3 s (Annex C). This is Kalibr's `*_random_walk`. If no +1/2 region is visible because the log is too short, write "not observable in T seconds" and leave it as an open question. Do not copy a number from a datasheet into this field without labeling it "datasheet".
4. Average the three axes per sensor for the Kalibr file and keep per-axis values in the report.
5. Write `imu.yaml`:
```
rostopic: /imu/data_raw
update_rate: <fs>
accelerometer_noise_density: <N_accel>
accelerometer_random_walk: <K_accel>
gyroscope_noise_density: <N_gyro>
gyroscope_random_walk: <K_gyro>
```
6. Kalibr documentation says static-bench values understate the noise on a moving platform and suggests inflating them. Record any inflation factor as a user decision with its value, never silently.

### Output
`imu_noise_params` and `imu.yaml`.

### Quality Gate
- Every value in `imu.yaml` has a tau range and a source (fit or "datasheet") in the report.
- `python3 -c "import yaml; print(yaml.safe_load(open('imu.yaml')))"` prints all six keys.

---

## Worked Example

Illustrative only. 200 Hz IMU, gap-free segment T = 3 h.

```
$ python3 allan.py static.csv
fs=200.00 Hz, gaps=0, T=10800 s
gyro_z: slope -0.50 over tau 0.01..2 s -> N = 1.6e-4 rad/s/sqrt(Hz)
gyro_z: min adev 2.1e-5 rad/s at tau 400 s -> B = 3.2e-5 rad/s
gyro_z: slope +0.5 over tau 1500..3000 s -> K = 2.4e-6 rad/s^2/sqrt(Hz)
```
`imu.yaml` written with axis means; inflation factor "none, user decision".

---

## Exit Criteria

DONE when N, B and K (or "not observable") are read for all six channels with tau ranges, and `imu.yaml` loads.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Gaps in log | **Adjust**: use the longest gap-free segment; if it is too short for the +1/2 region, **Return** to recording. |
| Phase 2 | Curve has a bump at short tau | **Adjust**: likely a vibration source or a filter in the IMU; record it and fit only outside the bump. |
| Phase 3 | No -1/2 region | **Stop**: data may be internally filtered or quantized; check the IMU digital low-pass filter setting. |
| Phase 3 | User wants datasheet values | **Adjust**: allow it, label each copied value "datasheet". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
