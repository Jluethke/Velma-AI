# Fault and Edge-Case Scenario Library

**One-line description:** Builds a versioned library of parameterized fault and edge-case scenarios (traffic conflicts, sensor degradation, environment, and signal faults) derived from the operational design domain, each with a seed, parameter values, the expected safe behavior, and the KPIs that judge it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `xosc_file` (string, required): A base scenario that passed schema validation.
- `scenario_check_report` (object, required): From `vsim-esmini-scenario-check`; must be "PASS" for the base scenario.
- `odd_description` (object, required): Operational design domain: road types, speed range, weather and lighting, traffic participants, and sensor set. Every library entry must fall inside it or be marked as an out-of-ODD test.

---

## Outputs

- `scenario_library` (object[]): One entry per scenario: id, category, source file, parameter values, seed, fault injection method, expected behavior, KPI names that judge it, and whether it is in or out of the ODD. Stored as `scenarios/library.yaml`.

---

## Phase 1: Enumerate Categories from the ODD

### Entry Criteria
- `scenario_check_report` verdict is "PASS".

### Actions
1. Walk this category table and keep each row that the ODD makes relevant. Cite ISO 21448 (SOTIF) triggering-condition practice and ISO 34502 scenario-based evaluation as the method sources; this flow does not claim conformance.

| Category | Example entries | Injection method (CARLA / Gazebo) |
|---|---|---|
| Traffic conflict | cut-in, cut-out revealing stopped vehicle, lead hard braking, merge | OpenSCENARIO actions with parameters |
| Vulnerable road user | occluded pedestrian crossing, cyclist overtaking | OpenSCENARIO pedestrian entity; occluder vehicle parked |
| Weather and light | fog, heavy rain, low sun, night | CARLA `world.set_weather(carla.WeatherParameters(fog_density=..., precipitation=..., sun_altitude_angle=...))`; Gazebo scene and sensor noise changes |
| Road surface | low friction patch | CARLA `static.trigger.friction` blueprint with `friction` and extent attributes; Gazebo `<surface><friction>` on a ground patch |
| Sensor dropout | camera blackout, LiDAR stop, GNSS loss | CARLA `sensor.stop()` at a tick then `listen` again; Gazebo: stop the bridge for that topic or toggle the sensor |
| Sensor degradation | added noise, latency, frozen frame | Middleware node that delays, repeats or adds noise to a topic |
| Signal fault (SIL/HIL) | missing CAN message, wrong checksum, stale counter | Replay tool drops or alters frames on a virtual bus only |

2. For each kept row, write the parameter ranges from the ODD (for example speed range). A range end that the ODD does not give is an open question.
3. Mark entries outside the ODD as `out_of_odd: true`; their expected behavior is a safe response such as a takeover request or minimal-risk maneuver defined by the system's own requirements.

### Output
Category list with parameter ranges.

### Quality Gate
- Every kept category cites the ODD field that makes it relevant.
- Every range end has a source or is listed as an open question.

---

## Phase 2: Generate Concrete Variants

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Sample parameter values: for small sets use every combination of listed values; for large spaces use a seeded sampler (record the sampler seed) or OpenSCENARIO `ParameterValueDistribution` (version 1.1 and later) in a separate distribution file if your runner supports it (check its docs).
2. Write each variant as its own `.xosc` by setting `ParameterDeclaration value` attributes (a small script in your project using `xml.etree.ElementTree`). Do not hand-edit dozens of files.
3. Give each variant a stable id: `<category>-<base>-<index>` and a seed.
4. Re-run `vsim-esmini-scenario-check` on every variant. A variant whose events never fire is not a test; fix or drop it with a recorded reason.

### Output
Variant `.xosc` files with ids and seeds.

### Quality Gate
- `ls scenarios/variants/*.xosc | wc -l` equals the library entry count.
- Every variant has an esmini verdict "PASS" or a recorded drop reason.

---

## Phase 3: Attach Expected Behavior and KPIs

### Entry Criteria
- Variants generated.

### Actions
1. For each entry write `expected_behavior` in observable terms ("ego does not collide", "ego stays in lane", "ego issues takeover request before the sensor-loss duration ends"). No adjectives such as "safely" without an observable.
2. Name the KPIs that judge it from the KPI set used in `vsim-scenario-kpis` (for example collision_count, min_ttc_s, max_decel_mps2, lane_invasion_count, route_completion_pct).
3. Write `scenarios/library.yaml` with fields id, category, file, params, seed, injection, expected_behavior, kpis, out_of_odd.
4. Version the library: commit it and record the commit hash. A change to any parameter creates a new id; never reuse an id for different values.

### Output
`scenario_library`.

### Quality Gate
- `python -c "import yaml; L=yaml.safe_load(open('scenarios/library.yaml')); print(all(e.get('kpis') and e.get('seed') is not None for e in L))"` prints `True`.

---

## Worked Example

Illustrative. ODD: divided highway, 60 to 110 km/h, day and night, dry and wet. Kept: traffic conflict (cut-in), weather (rain, night), road surface (wet patch), sensor dropout (camera blackout 1 s). Out of ODD: snow.
```
- id: cutin-highway-007
  category: traffic_conflict
  file: scenarios/variants/cutin-highway-007.xosc
  params: {EgoSpeed: 27.8, TriggerGap: 15.0, LcTime: 2.0}
  seed: 1007
  injection: openscenario
  expected_behavior: ego does not collide and does not leave its lane
  kpis: [collision_count, min_ttc_s, lane_invasion_count]
  out_of_odd: false
```

---

## Exit Criteria

DONE when every ODD-relevant category has seeded, runnable variants with observable expected behavior and named KPIs in a versioned `library.yaml`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Base scenario check is FAIL | **Stop**: fix the base scenario first. |
| Phase 1 | ODD silent on a range | **Return**: record an open question; do not invent the range. |
| Phase 2 | Variant events never fire | **Adjust**: fix parameters, or drop with a reason. |
| Phase 3 | Expected behavior not observable | **Adjust**: rewrite in terms a KPI can measure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
