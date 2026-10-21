# Per-Scenario KPI Computation

**One-line description:** Computes a fixed set of per-scenario KPIs (collisions, minimum time-to-collision, minimum time headway, peak deceleration and jerk, lane invasions, route completion) from CARLA or ROS 2 run logs with stated formulas, and compares each with a user-supplied threshold to give a pass or fail per scenario.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `run_logs` (object[], required): Per scenario id, the run outputs: for CARLA the `scenario_results` entry plus the per-frame actor-state CSV; for Gazebo/ROS 2 the recorded bag.
- `stack` (string, required): "carla" or "gazebo". Selects the extraction procedure.
- `kpi_thresholds` (object, required): Per KPI, the pass threshold and its source (system requirement, named standard clause such as ISO 15622 for ACC or ISO 22839 for forward collision mitigation, or owner decision). A KPI with no threshold is reported but not judged.

---

## Outputs

- `kpi_report` (object[]): Per scenario id: each KPI value, unit, threshold, threshold source, PASS / FAIL / NOT JUDGED, and the frame or time where the extreme value occurred. Saved as `results/kpi_report.csv` and `.json`.

---

## Phase 1: Extract Time Series

### Entry Criteria
- Every scenario id in `run_logs` has data.

### Actions
1. Build one table per scenario with columns: t (s), ego x, y, yaw, speed (m/s), longitudinal acceleration (m/s^2), lead vehicle id, gap to lead (bumper to bumper, m), lead speed, lane invasion events, collision events.
2. Extraction by `stack`:

| `stack` | Source | How |
|---|---|---|
| carla | actor-state CSV + collision and lane-invasion sensor logs | Gap from bounding boxes: center distance along ego heading minus half lengths (`actor.bounding_box.extent.x`). Acceleration from `actor.get_acceleration()` projected on heading. |
| gazebo | bag topics `/odom`, object list or ground-truth poses, contact topic | Read with `rosbag2_py`; use header stamps; compute gap from poses and model dimensions. |

3. Use simulation time, never wall time.
4. Lead selection: the nearest vehicle ahead whose lateral offset in ego frame is within half the lane width (lane width from the map, not assumed).

### Output
Per-scenario time-series CSVs.

### Quality Gate
- Every CSV has strictly increasing t (`python -c` check prints True).
- Sample interval equals the sim step (fixed step) for CARLA runs.

---

## Phase 2: Compute KPIs

### Entry Criteria
- Time series ready.

### Actions
1. Compute with these definitions (state them in the report):

| KPI | Definition |
|---|---|
| collision_count | Number of collision events involving the ego |
| min_ttc_s | Min over t of gap / (ego speed - lead speed) for samples where ego speed > lead speed; undefined (report "none") if never closing |
| min_thw_s | Min over t of gap / ego speed for ego speed > 0 |
| max_decel_mps2 | Max of minus longitudinal acceleration |
| max_jerk_mps3 | Max absolute first difference of acceleration divided by dt |
| lane_invasion_count | Number of lane-invasion events (CARLA sensor) or lane-boundary crossings from the map |
| route_completion_pct | Distance along route reached / route length times 100 (CARLA: scenario_runner `RouteCompletionTest` actual value) |

2. Jerk from differentiated acceleration amplifies noise; if a filter is applied, name it and its parameters in the report. Do not filter only when results fail.
3. Record the time of each extreme value.

### Output
KPI values per scenario.

### Quality Gate
- Every KPI row has a value or "none" with the reason.
- Times of extremes are recorded.

---

## Phase 3: Judge Against Thresholds

### Entry Criteria
- KPI values computed.

### Actions
1. For each KPI with a threshold in `kpi_thresholds`, compare in the stated direction (min KPIs pass when value >= threshold; max and count KPIs pass when value <= threshold).
2. KPIs with no threshold: "NOT JUDGED". Do not supply a threshold yourself.
3. A scenario passes only when every judged KPI passes and the scenario was not an infrastructure error.
4. Write `kpi_report` CSV and JSON.
5. Do NOT change thresholds in this flow to make a scenario pass. A threshold change is a requirement change and goes back to the owner.

### Output
`kpi_report`.

### Quality Gate
- Every scenario has a pass or fail and every FAIL names the KPI and its extreme time.
- Threshold source is filled for every judged KPI.

---

## Worked Example

Illustrative. `stack` = carla, scenario cutin-highway-007, thresholds from the system requirements document SRD-12.
```
id,kpi,value,unit,threshold,source,result,t_extreme
cutin-highway-007,collision_count,0,count,0,SRD-12 3.1,PASS,
cutin-highway-007,min_ttc_s,1.42,s,1.5,SRD-12 3.4,FAIL,5.35
cutin-highway-007,max_decel_mps2,6.1,m/s^2,,,NOT JUDGED,5.60
```

---

## Exit Criteria

DONE when every scenario has every KPI computed by the stated formula and judged against a sourced threshold or marked NOT JUDGED.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Time goes backward or repeats | **Adjust**: use header stamps or sim frames, not receive time. |
| Phase 1 | No lead vehicle data | **Adjust**: report TTC and THW as "none" with the reason. |
| Phase 3 | Threshold missing | **Return**: report NOT JUDGED and list the KPI for the owner. |
| Phase 3 | Request to relax a threshold to pass | **Stop**: threshold changes are requirement changes, not test fixes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
