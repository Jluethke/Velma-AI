# Weather Adjustment Module

Adjust the irrigation schedule based on weather forecasts.

## Inputs

- `irrigation-schedule`: Planned irrigation runs
- `weather-forecast`: Precipitation and temperature forecast

## Outputs

- `adjusted-schedule`: Schedule modified for expected rainfall or heat
- `adjustment-log`: Record of changes made and reasons

## Process

1. Review the precipitation forecast for the scheduling period.
2. Reduce or skip runs where effective rainfall will meet crop needs.
3. Increase irrigation before forecasted high-heat periods.
4. Log all adjustments with the reasoning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
