# Propulsion Requirements And Delta V Budget

Build the mission delta-v budget and the thrust and impulse requirements.

## Inputs

- `mission_profile`: Orbit insertion, stationkeeping, and disposal tasks over the mission.
- `spacecraft_mass`: Wet and dry mass estimates.
- `mission_lifetime`: Operating duration that scales the stationkeeping total.

## Outputs

- `delta_v_budget`: Delta-v allocated to each task, summed with margin.
- `thrust_requirements`: Minimum thrust for timely maneuvers.
- `impulse_requirements`: Total impulse the system must deliver.

## Process

1. List every delta-v task: orbit insertion or raising, stationkeeping, momentum unloading, and end-of-life disposal.
2. For geostationary stationkeeping budget north-south (inclination control) near 50 m/s per year and east-west (longitude control) near 2 m/s per year.
3. For low orbit budget drag makeup, which grows sharply at lower altitude and higher solar activity.
4. Include disposal: a geostationary craft reorbits about 235 km above the belt, and a low-orbit craft must deorbit within 25 years of end of mission.
5. Sum the tasks with margin to set the delta-v budget, multiply by mass for total impulse, and set a minimum thrust so each maneuver finishes within its operational window.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
