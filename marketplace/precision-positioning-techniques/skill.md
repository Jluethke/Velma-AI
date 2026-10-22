# Precision Positioning Techniques

Achieve sub-micrometer or nanometer positioning accuracy using advanced compensation, sensing, and control techniques.

## Inputs

- `cascade-controller`: Tuned cascade servo controller
- `precision-requirements`: Required positioning accuracy, repeatability, and settling time at target accuracy

## Outputs

- `precision-controller`: Enhanced controller with iterative learning, friction compensation, thermal drift compensation, and sensor strategy for nanometer-level accuracy
- `error-budget`: Breakdown of each error source and its contribution to total positioning error

## Process

1. Build the error budget: list every error source and its contribution. Typical sources: sensor resolution and noise, quantization of DAC command, Abbe error (angular error amplified by offset distance), thermal expansion (10nm/degree-C per cm of aluminum), servo tracking error, mechanical backlash, cable forces, vibration from floor and acoustic sources.
2. Select the position sensor for the required accuracy: encoder resolution (interpolation of sine/cosine signals gives sub-count resolution), linear scale (direct measurement at the point of interest eliminates Abbe error), capacitive sensor (sub-nanometer resolution, short range), laser interferometer (picometer resolution, long range, but sensitive to air refractive index changes).
3. Implement friction compensation: use a friction observer that estimates friction force from the discrepancy between commanded and actual acceleration, then cancel it with feedforward. For pre-sliding behavior (important for nanometer positioning), the observer must model the micro-displacement regime, not just Coulomb friction.
4. Implement iterative learning control (ILC) for repetitive trajectories: after each pass, update the feedforward signal by adding a correction proportional to the previous tracking error: u_ff_new(t) = Q * (u_ff_old(t) + L * e_old(t)) where L is the learning gain and Q is a low-pass filter that prevents learning at frequencies where the model is uncertain (above the servo bandwidth). ILC can reduce tracking error to the sensor noise floor within 5-20 iterations.
5. Compensate thermal drift: measure temperature at critical structural points and apply correction from a calibrated thermal model (expansion coefficient times temperature change times length). For the highest accuracy, use periodic reference measurements (touch probe, laser tracker) to recalibrate the thermal model online.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
