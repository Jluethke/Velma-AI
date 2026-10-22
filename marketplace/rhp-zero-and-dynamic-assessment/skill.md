# Rhp Zero And Dynamic Assessment

Analyze the dynamic behavior of the selected topology, identify right-half-plane zeros for boost-derived converters, and determine the maximum achievable control bandwidth.

## Inputs

- `inductance-selection`: Selected inductance and operating mode
- `operating-mode-map`: CCM/DCM regions across operating range

## Outputs

- `plant-transfer-function`: Small-signal transfer function of the power stage including parasitic ESR zeros, LC double pole, and any RHP zeros
- `bandwidth-limit`: Maximum achievable crossover frequency considering RHP zero location, switching frequency, and required phase margin

## Process

1. Derive the small-signal model using state-space averaging. For buck (voltage mode): Gvd(s) = Vout/D * (1 + s*Rc*Co) / (1 + s*(Rc + RL)*Co + s^2*L*Co) where Rc is ESR, RL is inductor DCR. This is a second-order system with an ESR zero and LC double pole.
2. For boost and buck-boost in CCM, identify the RHP zero: fz_rhp = (1-D)^2 * R / (2*pi*L) for boost. The RHP zero frequency drops with increasing load (lower R) and higher duty cycle. At worst case (max D, max load), calculate fz_rhp_min.
3. Set maximum crossover frequency. For converters without RHP zero: fc_max = fsw/5 to fsw/10. For converters with RHP zero: fc_max = fz_rhp_min / 3 to fz_rhp_min / 5. If this limits bandwidth below acceptable transient response, consider current-mode control (which moves the RHP zero frequency higher) or switching to a different topology.
4. For current-mode control, the inner current loop converts the LC double pole to a single pole at the load, simplifying outer voltage loop compensation. The subharmonic oscillation at D > 0.5 requires slope compensation: Se = (Vout - Vin) * Rs / L where Rs is the current sense gain.
5. Document the complete small-signal model with numerical values at the worst-case operating point. This feeds directly into the control loop compensation design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
