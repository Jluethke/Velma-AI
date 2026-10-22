# Laboratory Testing Program

Execute the laboratory testing program on collected samples for classification, strength, and deformability.

## Inputs

- `field-data`: Samples collected from boreholes with their depths and soil descriptions

## Outputs

- `lab-results`: Classification, strength, consolidation, and permeability test results by depth and location
- `design-parameters`: Characteristic and design values for each geotechnical unit (undrained shear strength, effective stress parameters, stiffness, permeability)

## Process

1. Classification tests on every sample: natural moisture content, Atterberg limits (LL, PL, PI) for cohesive soils, particle size distribution for granular soils. Classify per USCS. Specific gravity where needed for void ratio calculations.
2. Strength tests. Undrained shear strength in clay: UU triaxial (quick, multiple per borehole), CU triaxial with pore pressure measurement (fewer, but gives effective stress parameters c' and phi'). Effective stress parameters in sand: CD triaxial or direct shear. For rock: UCS (5 per rock unit minimum), point load test for supplementary data, Brazilian tensile strength.
3. Consolidation tests. One-dimensional oedometer on representative samples from each compressible layer. Determine Cc (compression index), Cr (recompression index), preconsolidation pressure (sigma_p from Casagrande construction), and cv (coefficient of consolidation from root-time or log-time method). At least 3 tests per compressible stratum.
4. Permeability tests. Falling head or constant head in the lab for cohesive soils. Note that lab permeability may underestimate field permeability by 1 to 2 orders (fabric effects, macro features). Compare with field values from pumping tests or CPT dissipation-derived ch.
5. Derive design parameters. Plot all data by depth and stratum. Remove outliers with justification. Select characteristic values: mean minus half a standard deviation for typical geotechnical assessment, or apply statistical methods per Eurocode 7 (cautious estimate of the mean). Distinguish between drained and undrained parameters. Derive constrained modulus from oedometer for settlement, or use CPT correlation (M = alpha*qt where alpha depends on soil type).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
