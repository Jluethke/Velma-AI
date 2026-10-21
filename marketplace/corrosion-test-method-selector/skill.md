# Corrosion Test Method Selector

Select the corrosion test method based on the application environment, material, and standards compliance requirements.

## Inputs

- `service-environment`: Exposure conditions in the application (salt water, acid, atmospheric, etc.)
- `materials-to-evaluate`: Alloys or coatings to test

## Outputs

- `selected-test-methods`: Salt spray (ASTM B117), electrochemical (ASTM G59/G61), immersion (ASTM G31), or cyclic
- `test-parameters`: Solution composition, temperature, duration, and electrode configuration

## Process

1. Match the service environment to the appropriate accelerated test standard.
2. Select salt spray for general atmospheric corrosion ranking, electrochemical for mechanism and rate data, immersion for uniform corrosion rate.
3. Define test duration, solution chemistry, and temperature.
4. Specify the number of replicates per material for statistical analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
