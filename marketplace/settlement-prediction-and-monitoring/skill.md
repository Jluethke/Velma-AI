# Settlement Prediction And Monitoring

Predict ground settlement from tunneling and design the monitoring system to verify predictions and protect structures.

## Inputs

- `face-pressure-regime`: Target face pressure profile along alignment
- `ground-model`: Ground conditions and surface structures along alignment

## Outputs

- `settlement-predictions`: Predicted settlement trough at each critical section: maximum settlement, trough width, volume loss, angular distortion at structures
- `monitoring-plan`: Instrument layout, reading frequency, trigger levels (green/amber/red), and contingency actions

## Process

1. Predict the settlement trough using the Gaussian trough method (Peck, 1969). Surface settlement S(y) = Smax * exp(-y^2 / (2 * i^2)), where y is horizontal distance from tunnel centerline, i is trough width parameter (i = K * z0, K depends on soil type: 0.25 to 0.35 in sand, 0.4 to 0.6 in clay, z0 is tunnel axis depth). Volume loss Vs = sqrt(2*pi) * Smax * i. Target volume loss depends on TBM type and ground: 0.5 to 1.0% for well-controlled EPB in clay, 1 to 2% in sand.
2. Assess building damage from predicted settlement. Calculate angular distortion (differential settlement between footings divided by span). Classify damage using Burland and Wroth framework: negligible (< 1/500), slight (1/500 to 1/200), moderate (1/200 to 1/50). For buildings in the influence zone, do building-specific assessment: greenfield settlement modified by building stiffness (relative stiffness method, Potts and Addenbrooke).
3. For critical structures, run 2D or 3D numerical analysis. FEM with appropriate constitutive model (Hardening Soil for sand, Soft Soil Creep for soft clay). Model the TBM process: face pressure, grout pressure, contraction around shield, weight of backup. Validate model against measured settlements from similar projects.
4. Design the monitoring array. Settlement pins on surface at 2 to 5 m spacing across the trough, extending to at least 2 to 3 times i from centerline. Inclinometers adjacent to sensitive structures (installed to below tunnel invert). Extensometers for multi-point subsurface settlement where surface pins are insufficient. Automated total stations for real-time monitoring of structures. Piezometers to track groundwater response.
5. Set trigger levels. Green: measured settlement within predicted range. Amber: settlement exceeding prediction by a defined margin (typically 120 to 150% of predicted, or angular distortion approaching damage threshold). Red: settlement indicating loss of face control or unexpected ground behavior. Define contingency actions for each level: amber triggers increased monitoring frequency and TBM parameter review; red triggers TBM stoppage, emergency grouting, and engineering review.
6. Plan compensation grouting for sensitive structures. Tube-a-manchette (TAM) installation from surface or shaft before TBM arrival. Grout injection during and after TBM passage to compensate for ground loss. Injection controlled by real-time monitoring of structure settlement. Fracture grouting in clay, permeation grouting in sand.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
