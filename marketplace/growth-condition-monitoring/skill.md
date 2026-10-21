# Growth Condition Monitoring

Monitor and record growth conditions throughout the trial: soil moisture, temperature, rainfall, and pest or disease pressure.

## Inputs

- `randomization-plan`: Plot map for georeferencing observation points
- `monitoring-schedule`: Frequency and timing of observations (weekly, phenological stage)

## Outputs

- `environment-log`: Time series of temperature, rainfall, soil moisture, and growing degree days
- `stress-events`: Dated records of drought, flood, frost, pest outbreak, or disease incidence

## Process

1. Install or confirm weather station and soil moisture sensors at the trial site
2. Record daily weather and compute cumulative growing degree days
3. Scout for pest and disease incidence on the prescribed schedule and record severity ratings
4. Flag stress events that may require covariate adjustment in the analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
