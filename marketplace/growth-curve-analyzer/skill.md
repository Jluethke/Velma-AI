# Growth Curve Analyzer

Analyze the growth curve: identify lag, exponential, and stationary phases, and compute the specific growth rate.

## Inputs

- `time-course-data`: Biomass vs. time
- `fermentation-conditions`: Inoculum size and medium for context

## Outputs

- `growth-parameters`: Lag time, max specific growth rate (mu_max), and time to stationary phase
- `phase-boundaries`: Time points marking transitions between lag, exponential, deceleration, and stationary phases

## Process

1. Plot ln(biomass) vs. time to identify the linear (exponential) region.
2. Fit a line to the exponential region: the slope is the specific growth rate mu_max.
3. Determine the lag phase duration as the x-intercept of the exponential fit minus the inoculation time.
4. Identify the transition to stationary phase where growth rate drops to near zero.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
