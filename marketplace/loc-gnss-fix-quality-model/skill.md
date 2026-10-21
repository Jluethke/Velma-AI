# GNSS Fix Quality And Measurement Noise Model

**One-line description:** Builds a GNSS measurement noise model keyed by fix type (single, DGPS, RTK float, RTK fixed) from the receiver's reported accuracy and from measured scatter at a static point, and checks whether the driver fills `NavSatFix.position_covariance` honestly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_bag` (string, required): rosbag2 path with the GNSS fix topic (`sensor_msgs/msg/NavSatFix`) and, if available, the receiver's native status messages.
- `sensor_datasheets` (object, required): Receiver horizontal and vertical accuracy specifications per mode as published by the vendor, with their stated confidence level (CEP, RMS or 2DRMS).

---

## Outputs

- `gnss_noise_model` (object): Per fix type: horizontal and vertical standard deviation (measured and receiver-reported), the source driver field, how `position_covariance_type` is set, and the rule the filter uses to choose R per message.

---

## Phase 1: Read What The Driver Publishes

### Entry Criteria
- `sensor_bag` contains the GNSS fix topic.

### Actions
1. Read one message: `ros2 bag play` then `ros2 topic echo --once /gnss/fix`, or iterate with `rosbags`. Record `status.status` values seen (-1 no fix, 0 fix, 1 SBAS fix, 2 GBAS fix per `sensor_msgs/msg/NavSatStatus`).
2. `NavSatStatus` does not distinguish RTK float from fixed. Find the receiver-native field that does: NMEA GGA quality indicator (4 = RTK fixed, 5 = RTK float), or u-blox NAV-PVT `carrSoln` (0 none, 1 float, 2 fixed). Record the topic and field.
3. Record `position_covariance_type` (0 unknown, 1 approximated, 2 diagonal known, 3 known). If it is 0, the covariance is meaningless and must be replaced.
4. Tabulate how long the drive spent in each fix type.

### Output
Driver field map and time per fix type.

### Quality Gate
- The fix-type field and its value meanings are cited from the receiver protocol document or NMEA 0183 standard.

---

## Phase 2: Measure Static Scatter

### Entry Criteria
- A static segment with the antenna not moving.

### Actions
1. Convert static fixes to local ENU with the project conversion module (or `pymap3d.geodetic2enu` around the segment mean).
2. Per fix type present, compute std of east, north and up. Also compute the autocorrelation time; GNSS errors are strongly time-correlated, so a short static window understates the error.
3. Convert the datasheet figure to a 1-sigma value only with the documented relation for its stated statistic: for a circular Gaussian, CEP = 1.1774 sigma and 2DRMS = 2.83 sigma (equal-axis assumption). If the datasheet does not state the statistic, record it as unknown rather than converting.
4. Compare the driver's reported covariance diagonal (sqrt) with the measured std.

### Output
Measured versus reported versus datasheet table.

### Quality Gate
- Every std in the table names its fix type, sample count and window length.

---

## Phase 3: Write The Per-Message R Rule

### Entry Criteria
- Table complete.

### Actions
1. Choose R per message with this table:

   | Driver covariance type | Rule |
   |---|---|
   | 2 or 3 and reported sqrt within the measured std range | use the reported covariance |
   | 2 or 3 but reported far below measured | scale the reported covariance by the measured-to-reported variance ratio, per fix type |
   | 0 or 1 | use the measured std for the current fix type |

2. For `no fix` (status -1), the filter must not ingest the message.
3. Because GNSS errors are time-correlated, note that feeding 10 Hz fixes with white R overweights them. Record the autocorrelation time so the filter design can decide on a subsampling rate or a correlated error state.

### Output
`gnss_noise_model`.

### Quality Gate
- The rule covers every fix type observed in Phase 1.

---

## Worked Example

Illustrative. u-blox receiver, `carrSoln` available. Static 15 min in RTK fixed: std E 0.008 m, N 0.010 m, U 0.021 m; reported sqrt covariance 0.014 m. In single fix: std E 0.9 m, N 1.3 m, U 2.4 m, autocorrelation time about 60 s. Rule: RTK fixed uses reported; single uses measured with a note that 10 Hz white updates overweight it.

---

## Exit Criteria

DONE when every observed fix type has a measured noise figure, the driver covariance is classified as trustworthy or replaced, and the per-message R rule is written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No native fix-type field | **Adjust**: treat all fixes as the worst observed type and state the limitation. |
| Phase 2 | No static segment | **Retry**: record a static log with the antenna fixed. |
| Phase 2 | Datasheet statistic unstated | **Return**: report it as unknown; do not convert. |
| Phase 3 | Reported covariance zero | **Adjust**: use measured std; a zero covariance makes the filter divergent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
