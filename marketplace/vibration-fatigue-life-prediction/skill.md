# Vibration Fatigue Life Prediction

Predict the fatigue life of solder joints and component leads under the vibration environment, using Miner's rule to accumulate damage from the full vibration spectrum.

## Inputs

- `response-psd-at-components`: Acceleration and stress at components
- `displacement-and-stress`: Deflection and solder joint stress

## Outputs

- `fatigue-life-predictions`: Predicted cycles to failure and equivalent hours for each critical solder joint and component lead under the specified vibration
- `design-margin`: Ratio of predicted life to required life for each critical location, identifying the weakest links in the design

## Process

1. Construct the S-N curve for the failure mode. For SnAgCu solder joint fatigue under vibration: use the Basquin equation sigma_a = sigma_f' * (2Nf)^b where sigma_f' is approximately 50 MPa and b is approximately -0.12 for SAC305 solder. For component lead fatigue: use the lead material properties (copper alloy, Kovar).
2. Calculate the stress amplitude at each critical solder joint from the board deflection. For a leadless chip component: sigma = E_solder * alpha * delta_board * h_solder / L_component^2 where delta_board is the local board curvature, h_solder is the standoff height, and L_component is the component length.
3. Apply Dirlik's method or the narrow-band approximation to convert the stress PSD into a rainflow cycle count distribution. Dirlik's method is preferred for broadband responses: it predicts the probability density of stress ranges from the spectral moments m0, m1, m2, m4 of the stress PSD.
4. Calculate cumulative damage using Miner's rule: D = sum(n_i / N_i) where n_i is the number of cycles at stress level i and N_i is the cycles to failure at that level from the S-N curve. Failure is predicted when D reaches 1.0. In practice, use D = 0.7 as the failure threshold to account for scatter.
5. Calculate the design margin: margin = (D_failure / D_service) where D_service is the accumulated damage over the required service life. A margin above 4.0 is comfortable. Between 2.0 and 4.0 is acceptable with test validation. Below 2.0 requires design changes or derating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
