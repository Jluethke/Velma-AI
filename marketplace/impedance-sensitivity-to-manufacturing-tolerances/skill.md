# Impedance Sensitivity To Manufacturing Tolerances

Analyze how manufacturing variations (dielectric thickness, trace width, copper weight, Dk) affect impedance, and set specifications that the fabricator can hold.

## Inputs

- `material-selection`: Selected materials with Dk values
- `symmetry-verification`: Verified symmetric stackup
- `signal-classes`: Impedance targets and tolerances

## Outputs

- `sensitivity-analysis`: Impedance change per unit change in each parameter: dZ/dh (dielectric height), dZ/dw (trace width), dZ/dDk (dielectric constant), dZ/dt (copper thickness)
- `manufacturing-tolerance-budget`: Allocated tolerance for each parameter such that the combined impedance variation stays within the target tolerance (RSS or worst-case)
- `fabricator-specification`: Specification document for the fabricator: target dielectric heights with tolerances, trace widths with tolerances, copper weights, and impedance coupon requirements

## Process

1. Run sensitivity sweeps in the field solver: vary each parameter independently by its expected manufacturing range. Typical tolerances: dielectric height +/- 10% (for standard, +/- 5% for controlled), trace width +/- 0.5 mil (standard) to +/- 0.25 mil (fine line), copper thickness +/- 10%, Dk +/- 5% (standard FR-4) to +/- 2% (controlled Dk materials).
2. Calculate partial derivatives: dZ/dh, dZ/dw, dZ/dDk, dZ/dt from the sweep data. For a typical 50-ohm microstrip: increasing h by 1 mil raises Z by about 3 to 5 ohms; increasing w by 1 mil lowers Z by about 3 to 4 ohms; increasing Dk by 0.1 lowers Z by about 1 ohm.
3. Combine using RSS (root sum of squares) for statistical tolerance: delta_Z_total = sqrt((dZ/dh * delta_h)^2 + (dZ/dw * delta_w)^2 + (dZ/dDk * delta_Dk)^2 + (dZ/dt * delta_t)^2). If the RSS result exceeds the impedance tolerance, tighten the dominant contributor. Usually dielectric height and trace width dominate.
4. Write the fabricator specification: specify finished dielectric heights (not prepreg thickness, which changes during lamination) with tolerances, trace widths as finished (after etching) with tolerances, and request controlled-Dk material if needed. Include impedance coupons for each impedance class with the target, tolerance, and TDR measurement method.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
