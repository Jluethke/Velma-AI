# Kinetics Parameter Reporter

Compile kinetic parameters into the final analysis report.

## Inputs

- `km-vmax`: Michaelis-Menten parameters
- `inhibition-type`: Inhibition classification
- `ki-value`: Inhibition constant
- `fit-quality`: Goodness of fit metrics

## Outputs

- `kinetics-report`: Full kinetic characterization report with parameters, plots, and interpretation
- `parameter-table`: Summary table of all kinetic constants with units and uncertainties

## Process

1. Compile Km, Vmax, kcat (if enzyme concentration is known), kcat/Km, Ki into a summary table
2. Include Michaelis-Menten plots, Lineweaver-Burk plots, and Dixon plots
3. State the assay conditions (buffer, pH, temperature) and their effect on parameter interpretation
4. Compare parameters against published values if available

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
