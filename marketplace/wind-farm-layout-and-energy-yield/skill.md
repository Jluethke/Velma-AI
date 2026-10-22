# Wind Farm Layout And Energy Yield

Optimize the wind farm layout for energy production while managing wake losses, turbulence loading, and site constraints, then produce a bankable energy yield estimate.

## Inputs

- `design-load-envelope`: Structural limits that constrain minimum turbine spacing
- `structural-verification`: Verified turbine capability under site-specific loads

## Outputs

- `optimized-layout`: Turbine positions with wake loss analysis, turbulence intensity at each position, and noise contour map
- `energy-yield-estimate`: P50 and P90 annual energy production with uncertainty breakdown (resource, wake model, availability, electrical losses, curtailment)

## Process

1. Set spacing constraints. Minimum spacing of 3-4 rotor diameters crosswind and 7-10 rotor diameters downwind reduces wake losses to acceptable levels. Tighter spacing increases energy density (MW/km2) but increases wake losses and turbulence loading on downstream turbines. Site constraints (setbacks from property lines, roads, wetlands, residences) further limit positions.
2. Run wake modeling. The Jensen/Park model is the simplest (single-wake deficit proportional to thrust coefficient). The Fuga or Bastankhah models add turbulence and terrain effects. For complex terrain, CFD-based wake models improve accuracy but increase computation time. Array efficiency (ratio of actual production to sum of free-stream turbine production) for a well-designed onshore farm is typically 90-95%.
3. Optimize the layout using a genetic algorithm or particle swarm optimizer. The objective function is typically net AEP (including wake losses) or LCOE. Constraints include minimum spacing, setbacks, maximum turbulence intensity (must not exceed the turbine's IEC turbulence class), and noise limits at sensitive receptors.
4. Compile the energy yield estimate. Start with gross energy (each turbine's free-stream production from the power curve and wind resource). Subtract wake losses (from the wake model), availability losses (typically 2-5% for onshore, accounting for scheduled maintenance and unscheduled downtime), electrical losses (transformer and cable losses, typically 2-3%), environmental losses (icing, high-temperature shutdown, 0.5-2%), and curtailment (grid curtailment or noise curtailment, site-specific).
5. Quantify uncertainty for P90 estimation. Major uncertainty sources: long-term wind resource (3-5% sigma), wind speed measurement (1-2%), vertical extrapolation (1-3%), wake model (2-4%), power curve (2-3%), availability (1-2%). Combine in quadrature (RSS) for total uncertainty. P90 = P50 x (1 - 1.28 x sigma_total). A typical onshore project has P90/P50 ratio of 0.88-0.92.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
