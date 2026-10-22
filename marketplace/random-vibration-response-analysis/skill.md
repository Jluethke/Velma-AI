# Random Vibration Response Analysis

Calculate the PCB and component response to random vibration, determining acceleration levels, displacements, and stresses at critical locations.

## Inputs

- `pcb-natural-frequencies`: Board natural frequencies
- `component-risk-assessment`: Risk-flagged components

## Outputs

- `response-psd-at-components`: Acceleration PSD and Grms at each critical component location, showing amplification at resonance
- `displacement-and-stress`: 3-sigma board deflection and solder joint stress at each critical location

## Process

1. Calculate the transmissibility at resonance. For a single-degree-of-freedom system: T_peak = Q = 1/(2*zeta) where zeta is the damping ratio. For a PCB in a card cage: Q typically ranges from 10 to 25. Higher Q means a sharper, taller resonance peak.
2. Calculate the response Grms at a component location using Miles' equation (valid when the PSD is approximately flat near resonance): Grms_response = sqrt(pi/2 * fn * Q * PSD_input_at_fn). For fn = 300Hz, Q = 15, PSD = 0.01 g^2/Hz: Grms = sqrt(1.571 * 300 * 15 * 0.01) = 8.4 Grms.
3. Convert acceleration to displacement at the board center: delta_rms = Grms * g / (2*pi*fn)^2. The 3-sigma displacement is 3 * delta_rms. Compare this to the allowable board deflection for solder joint survival.
4. Apply Steinberg's three-sigma criterion for solder joint fatigue. The allowable board deflection at a component location for 20 million cycles is: delta_allow = 0.00022 * B / (r * sqrt(L * C)) inches, where B is the shorter board edge, r is a component position factor (1.0 at center, 0.5 at edge), L is the component length, and C is a constant depending on package type (1.0 for leaded, 1.26 for BGA, 2.25 for leadless chip).
5. If the calculated 3-sigma deflection exceeds the allowable: add board stiffeners (ribs or metal backing plates), add support points (standoffs or staking posts), reduce component height with lower-profile alternatives, or relocate heavy components away from maximum deflection zones. Each change requires recalculating the natural frequency and response.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
