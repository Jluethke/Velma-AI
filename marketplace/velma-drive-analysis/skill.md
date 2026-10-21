# the system Drive Analysis

Post-drive analysis from CAN bus telemetry CSV logs captured by velma_telemetry.py.
Reads timestamped signal data (65+ decoded CAN signals at configurable sample rate),
computes acceleration and braking profiles, estimates fuel consumption from MAF and
injector data, scores driving smoothness, and compares against efficient baselines.
Tracks improvement over time and identifies specific moments where efficiency was lost.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INGEST     --> Load and validate telemetry CSV
PHASE 2: SEGMENT    --> Split drive into phases (idle, cruise, accel, decel, stop)
PHASE 3: COMPUTE    --> Calculate metrics for each segment and overall
PHASE 4: SCORE      --> Generate drive score with component breakdown
PHASE 5: ADVISE     --> Specific recommendations with timestamps
```

## Inputs

- `telemetry_log`: object -- Path to telemetry CSV file. `path` (string, path to CSV from
  velma_telemetry.py), `format` (string: "velma_csv" with columns: timestamp, signal_name,
  value, unit). Alternatively `raw_data` (array of {timestamp, signals} objects).
- `trip_context`: object -- (Optional) Trip metadata. `trip_type` (string: "commute", "highway",
  "city", "mixed"), `distance_miles` (float, odometer delta if known), `duration_minutes` (float),
  `weather` (string: "clear", "rain", "snow"), `traffic` (string: "light", "moderate", "heavy").
- `comparison_baseline`: object -- (Optional) Previous drive analysis for trend comparison.
  `date` (string), `score` (float), `fuel_efficiency` (float), `braking_events` (int).

## Outputs

- `drive_score`: object -- Overall score 0-100. `total` (int), `smoothness` (int, 0-25),
  `efficiency` (int, 0-25), `braking` (int, 0-25), `anticipation` (int, 0-25),
  `grade` (string: "A" through "F"), `percentile` (string: how this compares to average driving).
- `acceleration_profile`: object -- `events` (array of acceleration events), `avg_g_force` (float),
  `max_g_force` (float), `hard_accel_count` (int, events > 0.3g), `gentle_accel_pct` (float,
  percent of acceleration events under 0.15g), `time_at_throttle` (object: percent of drive
  at 0-10%, 10-30%, 30-60%, 60-100% throttle).
- `braking_analysis`: object -- `events` (array of braking events with timestamp, deceleration_g,
  duration_s, speed_before, speed_after), `hard_brake_count` (int, events > 0.4g),
  `avg_decel_g` (float), `brake_score` (int 0-25), `anticipation_events` (int, coasting
  before brake = good anticipation).
- fuel_efficiency: object -- `estimated_mpg` (float, from MAF-based calculation), `idle_pct`
  (float, percent of time at zero speed with engine running), `fuel_used_gal` (float estimate),
  `comparison` (string: vs EPA rating for the vehicle), `wasteful_moments` (array: timestamps
  where fuel was wasted, e.g. extended idling, aggressive acceleration).
- `recommendations`: array -- Each: `category` (string), `observation` (string with timestamp
  reference), `suggestion` (string), `potential_improvement` (string, estimated mpg gain or
  score improvement).

## Execution

### INGEST: Load and Validate Telemetry
### Entry Criteria
Telemetry CSV file exists from a completed drive.
### Actions
1. Parse CSV with columns: timestamp (epoch or ISO 8601), signal_name, value, unit.
   velma_telemetry.py outputs these 29 message types / 65+ signals:
   - Engine: RPM (CAN ID 0x2C4 byte 2-3), throttle_pct (0x2C4 byte 4), coolant_temp,
     intake_temp, MAF_gps (mass airflow grams per second), fuel_rate.
   - Vehicle: speed_kmh (0x2A8 byte 0-1), gear_position (0x2C4 byte 6), brake_pressed
     (0x2C0 bit), cruise_set_speed, odometer.
   - Acceleration: accel_pedal_pct (0x2C4), lateral_g (0x2D0), longitudinal_g (0x2D0).
   - Steering: steering_angle (0x2D4), steering_rate.
2. Validate data quality:
   - Check for gaps > 2 seconds (telemetry dropout). Flag but continue.
   - Check for impossible values (RPM > 7000, speed > 250 km/h, temp > 200 C).
   - Require minimum 60 seconds of data with speed > 0 for meaningful analysis.
3. Compute derived signals if not directly available:
   - If no acceleration signal: differentiate speed (delta_v / delta_t).
   - If no MAF: estimate from RPM, throttle position, and volumetric efficiency model.
4. Establish time axis and resample to uniform intervals (10 Hz) for analysis.
### Output
Cleaned, validated signal matrix at uniform sample rate.
### Quality Gate
At least 60 seconds of valid speed data; fewer than 10% of samples flagged as gaps.

### SEGMENT: Split into Drive Phases
### Entry Criteria
Validated signal matrix loaded.
### Actions
1. Classify each time window (1-second blocks) into a phase:
   - **Idle**: speed < 3 km/h AND RPM > 0. Engine running, vehicle stationary.
   - **Cruise**: speed > 20 km/h AND throttle change < 2%/sec for > 5 seconds. Steady state.
   - **Acceleration**: throttle > 10% AND speed increasing > 1 km/h/sec.
   - **Deceleration**: speed decreasing > 1 km/h/sec. Sub-classify: coasting (throttle < 5%,
     no brake) vs braking (brake_pressed = true or decel > 0.15g).
   - **Stop**: speed = 0 AND RPM = 0 (engine off) or speed = 0 AND RPM > 0 (engine on, stopped).
2. Merge adjacent same-phase windows into segments. Record start_time, end_time, duration.
3. Compute phase distribution: percent of drive time in each phase.
   Efficient driving: cruise > 50% for highway trips, idle < 15% for city.
4. Identify transitions: accel-to-cruise (good merging), accel-to-brake (anticipation failure),
   coast-to-brake (good anticipation), cruise-to-hard-brake (unexpected stop or late reaction).
### Output
Segment list with phase labels, timestamps, and transition classification.
### Quality Gate
Every second of the drive assigned to exactly one phase.

### COMPUTE: Calculate Metrics
### Entry Criteria
Drive segmented into phases.
### Actions
1. Acceleration metrics:
   - For each acceleration segment: compute peak g-force from speed derivative or accel signal.
   - Classify: gentle (< 0.1g), moderate (0.1-0.2g), firm (0.2-0.3g), hard (> 0.3g).
   - Pentastar 3.6L target vehicle full throttle 0-60: approximately 0.3-0.4g sustained.
   - Compute throttle position histogram: time spent at each 10% band.
2. Braking metrics:
   - For each braking segment: peak deceleration, duration, speed delta.
   - Classify: gentle (< 0.15g), moderate (0.15-0.3g), firm (0.3-0.4g), hard (> 0.4g),
     emergency (> 0.7g).
   - Count anticipation events: decel segment preceded by > 3 seconds of coasting = driver
     saw the stop coming and lifted throttle early (good).
   - Count surprise brakes: acceleration directly followed by hard braking within 3 seconds.
3. Fuel efficiency estimate from MAF:
   - Fuel rate (g/s) = MAF (g/s) / stoichiometric ratio (14.7 for gasoline).
   - Integrate fuel rate over time = total fuel consumed (grams). Convert to gallons (1 gal = 2,722 g).
   - MPG = distance_miles / fuel_gallons. EPA combined for target vehicle 3.6L: 21 MPG.
   - Identify wasteful moments: idle > 60 seconds (turn off engine saves fuel),
     hard acceleration events (each costs approximately 0.01-0.02 gal extra vs gentle).
4. Smoothness metrics:
   - Jerk = rate of change of acceleration. High jerk = jerky driving. Compute RMS jerk.
   - Steering smoothness: standard deviation of steering rate during cruise segments.
   - Speed consistency: standard deviation of speed during cruise segments.
### Output
All computed metrics with per-event detail.
### Quality Gate
Fuel estimate within 30% of EPA rating (sanity check on MAF data quality).

### SCORE: Generate Drive Score
### Entry Criteria
All metrics computed.
### Actions
1. Score each component 0-25:
   - **Smoothness** (25 pts): based on RMS jerk, steering smoothness, speed consistency.
     25 = glass smooth (RMS jerk < 0.5 m/s3). 0 = constant jerking.
   - **Efficiency** (25 pts): based on estimated MPG vs EPA, idle percentage, throttle histogram.
     25 = exceeds EPA by 10%+. 0 = below EPA by 30%+.
   - **Braking** (25 pts): based on hard brake count, average deceleration, brake-to-accel ratio.
     25 = zero hard brakes, mostly gentle deceleration. 0 = frequent emergency braking.
   - **Anticipation** (25 pts): based on coasting-before-brake ratio, accel-to-brake transitions.
     25 = always coasts before stopping. 0 = always accelerates until braking.
2. Total = sum of components (0-100). Grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60).
3. If comparison_baseline provided:
   - Compute delta for each component and total.
   - Identify most improved and most declined categories.
   - Track streak: consecutive improving drives.
### Output
drive_score object with total, components, grade, and trend.
### Quality Gate
All four component scores computed; total equals their sum.

### ADVISE: Specific Recommendations
### Entry Criteria
Drive scored with component breakdown.
### Actions
1. For each component scoring below 20/25, generate specific recommendation:
   - Low smoothness: "At [timestamp], rapid throttle change from 15% to 65% in 0.8 seconds.
     Gradual application over 2-3 seconds reduces jerk and improves passenger comfort."
   - Low efficiency: "Spent 4 minutes 23 seconds idling at [location/time]. Engine-off at
     stops longer than 30 seconds saves approximately 0.01 gal per minute."
   - Low braking: "Hard brake event at [timestamp]: 0.52g deceleration from 72 km/h.
     Earlier throttle lift at the preceding cruise segment would have reduced this to 0.2g."
   - Low anticipation: "Three accel-to-brake transitions in 2 minutes at [timestamp range].
     Maintain following distance to allow coasting before stops."
2. Quantify potential improvement for each recommendation:
   - "Eliminating the 3 hard acceleration events would improve efficiency by approximately 0.5 MPG."
   - "Reducing idle time by 2 minutes would save approximately 0.02 gallons per trip."
3. Rank recommendations by impact (largest score improvement first).
### Output
recommendations array ranked by potential improvement.
### Quality Gate
At least one recommendation per component scoring below 20.


---

## Worked Example

Illustrative only.

Given typical inputs for Post-drive analysis from CAN bus telemetry logs. Reads the CSV output from velma, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. Telemetry loaded and validated with signal quality report
2. Drive segmented into idle/cruise/accel/decel/stop phases
3. All four score components computed with supporting metrics
4. Drive score rendered with grade and trend
5. Recommendations produced for every below-average component

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| INGEST | CSV missing required columns | Map available columns; warn about missing signals |
| INGEST | Drive shorter than 60 seconds | Return partial analysis with low confidence warning |
| INGEST | Telemetry gaps > 30 seconds | Split into separate drive segments; analyze each |
| SEGMENT | Speed signal flatlined (stuck sensor) | Flag as unreliable; skip speed-dependent metrics |
| COMPUTE | MAF signal not available | Skip fuel efficiency; note in report as "unavailable" |
| COMPUTE | Estimated MPG > 40 (implausible for target vehicle) | Flag MAF calibration issue; report raw numbers with caveat |
| SCORE | Fewer than 2 components computable | Report partial score with disclaimer |

## State Persistence

- Drive history: date, score, component scores, distance, duration, estimated MPG
- Personal baselines: 30-day rolling average for each metric
- Improvement streaks: consecutive drives with improving total score

## Reference

### CAN Signal Sources for Drive Analysis

| Signal | CAN ID | Bytes | Unit | Sample Rate |
|--------|--------|-------|------|-------------|
| Vehicle speed | 0x2A8 | 0-1 | km/h | 50 Hz |
| Engine RPM | 0x2C4 | 2-3 | RPM | 50 Hz |
| Throttle position | 0x2C4 | 4 | % | 50 Hz |
| Brake pressed | 0x2C0 | bit | bool | 50 Hz |
| Steering angle | 0x2D4 | 0-1 | deg | 50 Hz |
| Lateral accel | 0x2D0 | 0-1 | g | 50 Hz |
| Longitudinal accel | 0x2D0 | 2-3 | g | 50 Hz |
| Gear position | 0x2C4 | 6 | enum | 10 Hz |

### Scoring Thresholds

| Metric | Excellent | Good | Fair | Poor |
|--------|-----------|------|------|------|
| Hard brakes per mile | 0 | < 0.5 | < 1.5 | > 1.5 |
| Hard accels per mile | 0 | < 0.3 | < 1.0 | > 1.0 |
| Idle % of drive time | < 5% | < 15% | < 25% | > 25% |
| Coast-before-brake % | > 80% | > 60% | > 40% | < 40% |
| RMS jerk (m/s3) | < 0.5 | < 1.0 | < 2.0 | > 2.0 |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
