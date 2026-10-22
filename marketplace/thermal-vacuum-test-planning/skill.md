# Thermal Vacuum Test Planning

Plan and execute thermal vacuum testing to validate the thermal design: define test levels, temperature cycles, instrumentation, and correlation of the thermal model to test data.

## Inputs

- `thermal-hardware-design`: Complete thermal control system design
- `temperature-predictions`: Model predictions to validate

## Outputs

- `tvac-test-plan`: Test matrix with temperature levels, dwell times, cycle count, instrumentation plan
- `model-correlation-results`: Thermal model updates from test-to-prediction comparison, updated temperature predictions

## Process

1. Define test levels. Qualification test temperatures are typically component qualification limits minus 5C (or acceptance limits plus 10C). Acceptance test temperatures are the predicted hot and cold extremes plus margin (typically +/- 5-10C beyond predicted). Protoflight testing uses qualification levels with acceptance duration.
2. Design the thermal environment simulation. In a thermal vacuum chamber, solar simulation uses xenon arc lamps or IR heaters (cheaper but different spectral distribution). For component-level testing, a thermal plate (hot/cold) with conductive interface is standard. Chamber pressure must be below 10^-5 torr to eliminate convection.
3. Plan instrumentation. Place thermocouples at all model node locations, on heaters (for functional verification), on MLI exterior (to verify effective emissivity), and at structural interfaces. Use a minimum of two thermocouples per critical component for redundancy. Type T thermocouples give best accuracy at spacecraft temperatures (-100 to +100 C).
4. Define the test sequence: pump-down, initial ambient soak, transition to hot case (with electrical loads on), hot dwell at stabilization (temperature change < 1C/hr for 4 hours), transition to cold case (reduce loads, activate heaters), cold dwell at stabilization, repeat for required number of cycles (4 for qualification, 2 for acceptance), return to ambient.
5. Perform model correlation. Compare measured temperatures to predictions for each test case. If discrepancies exceed 5C, investigate the model: check interface conductances (most common error source), radiation view factors, and heater performance. Adjust model parameters to match test data within 3C, then re-run the flight predictions with the correlated model. The correlated model becomes the reference for thermal margin assessment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
