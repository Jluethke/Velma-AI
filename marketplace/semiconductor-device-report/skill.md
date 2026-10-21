# Semiconductor Device Report

Compile all characterization results into a device report with parameter tables, comparison to specifications, and a quality assessment.

## Inputs

- `extracted-parameters`: I-V parameters (threshold, gm, on-off)
- `doping-profile`: Doping concentration vs depth from C-V
- `carrier-properties`: Carrier type, concentration, and mobility from Hall
- `trap-parameters`: Identified defect levels and densities

## Outputs

- `semiconductor-report`: Full characterization report with parameter tables, figures, and conclusions
- `characterization-data-package`: All raw data and extracted parameters for archival

## Process

1. Tabulate all extracted parameters alongside target specifications
2. Generate standard figures (I-V curves, C-V curves, doping profile, DLTS spectrum)
3. Compare results to the design target or published literature values
4. Write the conclusions and identify any performance or defect concerns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
