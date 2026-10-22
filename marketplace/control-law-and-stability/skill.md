# Control Law And Stability

Define control modes and design the feedback law with adequate stability margins.

## Inputs

- `sensor_suite`: Measurements feeding the controller.
- `wheel_sizing`: Actuator authority available to the controller.
- `control_authority`: Torque and momentum headroom.
- `pointing_budget`: Accuracy and jitter the loop must achieve.

## Outputs

- `control_modes`: Detumble, Sun-safe, and nominal pointing modes.
- `controller_gains`: Feedback gains and loop bandwidth.
- `stability_margins`: Gain and phase margins against flexible modes.

## Process

1. Detumble after separation with the B-dot law m = -k * dB/dt, which drives body rates toward zero using only magnetometer and torquers.
2. Use quaternion-feedback proportional-derivative control for nominal pointing: torque = -Kp * quaternion_error - Kd * rate_error.
3. Set the control bandwidth a factor of 5 to 10 below the first flexible-body mode so the loop does not excite structural flexibility.
4. Hold at least 6 dB gain margin and 30 deg phase margin, and add a notch filter if a flexible mode sits near the crossover.
5. Define clean mode transitions (detumble to Sun-safe to nominal) and verify jitter from wheel static and dynamic imbalance stays within the stability allocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
