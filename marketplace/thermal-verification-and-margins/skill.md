# Thermal Verification And Margins

Build and correlate the thermal model, run thermal-vacuum testing, and confirm qualification margins.

## Inputs

- `mli_design`: Passive insulation to represent in the model.
- `heater_sizing`: Heater control to verify under test.
- `active_control_plan`: Active elements that must meet setpoints.

## Outputs

- `thermal_math_model`: Reduced nodal model with conductors and heat loads.
- `test_plan`: Thermal-balance and thermal-vacuum cycle plan.
- `verified_margins`: Measured temperature margins against limits.

## Process

1. Build a reduced thermal model of nodes and linear and radiative conductors; run the hot and cold cases and the transient eclipse to predict every component temperature.
2. Run a thermal-balance test in vacuum and correlate the model to measured steady temperatures within 3 to 5 C before trusting its predictions.
3. Apply qualification margins of about plus or minus 10 to 15 C beyond the acceptance range, and design to the hotter and colder predicted bounds.
4. Run thermal-vacuum cycling with hot and cold soaks to expose workmanship defects and confirm heater and louver behavior across the range.
5. Confirm heater duty cycle has headroom (below roughly 80 percent) and that every component holds within its allowable range at both design extremes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
