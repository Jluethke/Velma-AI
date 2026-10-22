# Drop Off Measurer

Measure drop-off rates at each funnel stage.

## Inputs

- `funnel-stages`: Stage definitions
- `tracking-requirements`: Events to measure

## Outputs

- `drop-off-rates`: Conversion and drop-off rate per stage
- `volume-by-stage`: User count at each stage

## Process

1. Pull user counts at each funnel stage
2. Calculate conversion and drop-off rates between stages
3. Identify the stages with the highest absolute and relative drop-off

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
