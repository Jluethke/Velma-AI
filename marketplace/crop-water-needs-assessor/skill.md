# Crop Water Needs Assessor

Assess crop water requirements by growth stage and evapotranspiration.

## Inputs

- `moisture-profile`: Current soil moisture levels
- `crop-stage-data`: Current growth stage for each crop

## Outputs

- `water-requirements`: Water needs by crop and zone in inches per week
- `critical-periods`: Growth stages with highest water sensitivity

## Process

1. Look up crop coefficient (Kc) for the current growth stage.
2. Calculate daily evapotranspiration using weather data.
3. Compute net irrigation requirement minus effective rainfall.
4. Identify crops in critical water-sensitive growth stages.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
