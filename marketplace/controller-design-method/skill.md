# Controller Design Method

Design the controller: select the control architecture, tune PID or state-feedback gains, and ensure the controller meets performance specifications.

## Inputs

- `plant-model`: Identified plant model with uncertainty
- `performance-requirements`: Bandwidth, settling time, overshoot, and disturbance rejection requirements

## Outputs

- `controller-design`: Controller transfer function or gain matrices with all parameters
- `predicted-performance`: Simulated closed-loop performance against specifications

## Process

1. Select the control architecture. SISO with PID: for plants with a single dominant mode, PID is sufficient and well-understood. P for speed, I for steady-state accuracy, D for damping. Lead-lag compensation: for plants needing phase boost at crossover (lead) or low-frequency gain increase (lag). MIMO state feedback (LQR): for multi-input-multi-output systems, optimal for balancing response speed against control effort. State feedback with observer (LQG): when not all states are measurable, design a Kalman filter to estimate them. Select the simplest architecture that meets the specifications.
2. Design PID controller from the plant model. Method 1 (loop shaping): plot the open-loop Bode plot, design the controller to shape it: crossover frequency sets bandwidth (choose based on settling time: bandwidth ~ 4/settling_time), slope of -20 dB/decade at crossover for stability, add phase lead (D term) if the plant phase is too negative at crossover, add lag (I term) for low-frequency gain. Method 2 (pole placement): specify desired closed-loop poles from the performance requirements (natural frequency from bandwidth, damping ratio from overshoot), compute PID gains that place the closed-loop poles there. Method 3 (optimization): minimize a cost function (e.g., ITAE) over the PID gains with constraints on overshoot and settling time.
3. Design LQR state feedback (for multi-input or high-order systems). Form the cost function J = integral(x'Qx + u'Ru)dt. Q weights the state errors: larger Q penalizes deviation from the setpoint more, giving faster response. R weights the control effort: larger R gives smoother control inputs. Start with Q = C'C (penalizes output error) and R = I (equal penalty on all inputs). Solve the algebraic Riccati equation for the optimal gain K. Simulate the closed-loop response. Adjust Q and R to meet specifications: if too slow, increase Q; if control is too aggressive, increase R. If not all states are measurable, design a Kalman filter (observer) with the same model and measurement noise characteristics.
4. Simulate the closed-loop performance. Apply: step reference (check rise time, overshoot, settling time, steady-state error), step disturbance (check rejection speed and steady-state), noise on the measurement (check that high-frequency controller action is acceptable). Verify all specifications are met. If not, iterate on the controller design. Check actuator saturation: simulate with realistic actuator limits and verify the closed-loop does not wind up (add anti-windup for PID) or become unstable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
