# Anti Windup And Mode Switching

Handle actuator saturation, controller mode switching, and bumpless transfer between controllers in the digital implementation.

## Inputs

- `discrete-controller`: Controller with integrator states that can wind up
- `actuator-limits`: Saturation limits and rate limits of the actuator

## Outputs

- `anti-windup-controller`: Controller with anti-windup logic, bumpless transfer between modes, and safe initialization
- `saturation-response-verification`: Time-domain simulation showing behavior during and after saturation events

## Process

1. Implement back-calculation anti-windup: when the controller output exceeds the actuator limit, feed back the difference (u_commanded - u_actual) through a gain 1/T_t to the integrator. T_t is the anti-windup time constant: set it equal to the integral time constant Ti for PI controllers, or sqrt(Ti*Td) for PID controllers. This drives the integrator state to a value consistent with the saturated output.
2. For state-space controllers, the anti-windup is: x[k+1] = A_c*x[k] + B_c*y[k] + L_aw*(u_actual - u_commanded) where L_aw is chosen so that A_c - L_aw*C_c is stable with fast eigenvalues. The Observer-based anti-windup sets L_aw = B_c (simple and effective for many cases).
3. For mode switching (e.g., manual to automatic, or switching between two controllers): implement bumpless transfer by initializing the new controller's integrator states so that its first output matches the current actuator output. For state-space controllers, solve for x_new such that C_c*x_new + D_c*y = u_current.
4. Safe initialization at startup: set the integrator states to zero only if zero control is safe. Otherwise, initialize the controller in tracking mode (matching its output to the current actuator position) before engaging closed-loop control.
5. Verify: simulate a scenario where the reference commands a large step that saturates the actuator. During saturation, the integrator should not wind up (output should not overshoot excessively when the actuator exits saturation). Also verify bumpless transfer: switch controllers during operation and confirm no output transient beyond one sample period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
