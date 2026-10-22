# Plasma Parameter Specification

Determine required plasma parameters from the Lawson criterion: density, temperature, and confinement time for net energy gain. Calculate required triple product for Q > 1 and Q > 10 targets.

## Inputs

- `fusion-power-target`: Target fusion power output in MW
- `fuel-cycle`: D-T, D-D, or D-He3 fuel cycle selection

## Outputs

- `plasma-density`: Required plasma density in particles per cubic meter
- `plasma-temperature`: Required ion temperature in keV
- `confinement-time`: Required energy confinement time in seconds
- `triple-product-target`: Required n*T*tau for target Q value

## Process

1. Start from the Lawson criterion: n*T*tau_E >= 3e21 keV*s/m3 for D-T ignition. For finite Q, use the generalized form including alpha heating fraction.
2. Select operating temperature from the D-T reactivity curve peak near 15 keV. Calculate the fusion power density P_fus = n_D * n_T * sigma_v * E_fus / 4 for 50/50 D-T mix.
3. Derive required density from fusion power target and plasma volume. Check that density is below the Greenwald limit n_G = I_p / (pi * a^2) in units of 10^20/m3.
4. Estimate confinement time from empirical scaling laws (IPB98(y,2) for H-mode): tau_E scales with I_p^0.93, B_T^0.15, n^0.41, P^-0.69, R^1.97, a/R^0.58, kappa^0.78, M^0.19.
5. Calculate the required auxiliary heating power from P_aux = P_loss - P_alpha where P_alpha = 0.2 * P_fus and P_loss = W / tau_E with W = 3/2 * n * T * Volume.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
