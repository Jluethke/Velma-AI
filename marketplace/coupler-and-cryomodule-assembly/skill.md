# Coupler And Cryomodule Assembly

Design the input power coupler, HOM couplers, and integrate the dressed cavity into a cryomodule for the accelerator.

## Inputs

- `surface-recipe`: Completed surface treatment
- `expected-performance`: Predicted cavity performance
- `quality-control-plan`: QC inspection results

## Outputs

- `coupler-design`: Input coupler power handling, Qext, and thermal intercepts
- `cryomodule-design`: Helium vessel, magnetic shielding, alignment, and cryogenic piping
- `acceptance-test-results`: Vertical test Q0 vs Eacc and horizontal test with beam loading

## Process

1. Design input power coupler: required Qext from beam loading: P_beam = V_cav * I_beam * cos(phi_s). Qext = omega * U / P_coupled. Coupler type: coaxial (most common, variable coupling with antenna depth), waveguide (for high power, no window in vacuum). Thermal design: intercepts at 70K and 4K to limit heat leak.
2. Design HOM couplers: coaxial loop or waveguide couplers on beam pipe to extract HOM power. Notch filter to reject fundamental mode while coupling to HOMs. Ferrite or resistive load on 70K stage absorbs HOM power. Alternative: large beam pipe cutoff for all HOMs (CEBAF-style).
3. Vertical test: bare cavity in a vertical cryostat, weakly coupled input/pickup antennas. Measure Q0 vs Eacc by pulsed or CW decay method. Map field emission onset, quench field, and radiation. Compare to surface treatment expectations. Accept or re-process.
4. Dress cavity in helium vessel: weld titanium helium jacket around cavity (titanium for CTE match to niobium). Magnetic shielding: cryoperm (mu-metal) shield to keep residual field < 5 mG at the cavity (trapped flux degrades Q0 by ~3 nOhm per mG).
5. Assemble cryomodule: install dressed cavities in string, align (wire position monitors, < 0.5mm), connect helium and instrumentation, install couplers, close vacuum vessel with thermal shields (aluminum, MLI). Final leak check, cool-down, and acceptance test with RF at operating gradient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
