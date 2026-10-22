# Heat Exchanger Thermal Design

Perform the thermal design of a heat exchanger from duty specification through UA determination.

## Inputs

- `process-conditions`: Hot and cold stream temperatures, flow rates, and fluid properties
- `heat-duty`: Required heat transfer rate in kW

## Outputs

- `lmtd-and-correction`: Log mean temperature difference and F factor for selected configuration
- `overall-htc`: Estimated overall heat transfer coefficient from individual film coefficients
- `required-area`: Required heat transfer area with fouling allowance

## Process

1. Calculate LMTD for counterflow arrangement: delta_T_lm = (delta_T1 - delta_T2) / ln(delta_T1/delta_T2). For multipass, apply the correction factor F from P-NTU charts. F must exceed 0.75; below this, the temperature cross is too severe for the selected configuration.
2. Estimate tube-side heat transfer coefficient from Dittus-Boelter (turbulent) or Sieder-Tate (laminar with viscosity correction). For shell-side, use the Bell-Delaware method which accounts for baffle geometry, leakage, and bypass streams.
3. Calculate the overall coefficient: 1/U = 1/h_o + R_fo + (d_o * ln(d_o/d_i))/(2*k_w) + R_fi*(d_o/d_i) + (d_o/d_i)/h_i. Include fouling resistances from TEMA tables by service type. Typical fouling: 0.00017 to 0.00035 m2K/W for clean fluids, up to 0.001 for dirty.
4. Calculate required area: A = Q / (U * F * delta_T_lm). Add 10% to 20% overdesign margin. Check that the assumed U is consistent with the calculated U; iterate if they differ by more than 10%.
5. Verify with the effectiveness-NTU method as a crosscheck: calculate NTU = UA/(C_min), effectiveness = Q/(C_min * (T_h_in - T_c_in)). Plot on the appropriate effectiveness chart for the configuration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
