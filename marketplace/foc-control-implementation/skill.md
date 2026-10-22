# Foc Control Implementation

Implement field-oriented control (FOC) for the motor drive: Clarke and Park transforms, PI current regulators for d and q axes, space vector PWM, and speed/position control outer loop.

## Inputs

- `motor-selection`: Motor parameters: Ld, Lq, R, flux linkage lambda_m, pole pairs p, inertia J
- `control-spec`: Current loop bandwidth, speed loop bandwidth, position accuracy if applicable, PWM frequency

## Outputs

- `control-architecture`: Block diagram of the full FOC: outer speed/position loop, inner d-q current loops, decoupling terms, and SVPWM modulator
- `pi-tuning`: PI gains for the d-axis current loop (Kp_d, Ki_d), q-axis current loop (Kp_q, Ki_q), and speed loop (Kp_s, Ki_s), with the bandwidth and phase margin of each loop

## Process

1. FOC transforms three-phase sinusoidal quantities into DC quantities in the rotating d-q frame, where standard PI controllers work well. The signal chain is: measure ia, ib, ic -> Clarke transform (abc to alpha-beta) -> Park transform (alpha-beta to d-q using rotor angle theta_e) -> PI controllers on id and iq -> inverse Park -> SVPWM -> gate signals.
2. Clarke transform: i_alpha = ia, i_beta = (ia + 2*ib)/sqrt(3) (assuming ia + ib + ic = 0). Park transform: id = i_alpha*cos(theta_e) + i_beta*sin(theta_e), iq = -i_alpha*sin(theta_e) + i_beta*cos(theta_e). The rotor electrical angle theta_e = p * theta_mechanical where p is the number of pole pairs.
3. Current loop tuning: the d-axis plant is Gd(s) = 1/(Ld*s + R) with a single pole at R/Ld. The PI controller Gc(s) = Kp + Ki/s places a zero to cancel the plant pole: Ki/Kp = R/Ld. Then Kp sets the bandwidth: Kp = 2*pi*fc_current * Ld where fc_current is the desired current loop bandwidth (typically fsw/5 to fsw/10). Repeat for q-axis with Lq instead of Ld (they differ for IPM motors).
4. Add decoupling terms to cancel the cross-coupling between d and q axes: Vd_decouple = -omega_e * Lq * iq, Vq_decouple = omega_e * (Ld * id + lambda_m). Without decoupling, d and q axes interact and the step response shows oscillation. The decoupled plant is two independent first-order systems.
5. Speed loop: the plant from iq to speed is G_speed(s) = (3/2)*p*lambda_m / (J*s + B) where J is inertia and B is friction. Tune the speed PI with bandwidth 5 to 10 times slower than the current loop. For position control, add an outer proportional controller on the position error feeding the speed reference, with bandwidth 3 to 5 times slower than the speed loop.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
