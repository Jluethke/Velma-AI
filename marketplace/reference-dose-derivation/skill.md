# Reference Dose Derivation

Derive the reference dose (RfD) or benchmark dose (BMD) from the dose-response data using appropriate uncertainty factors.

## Inputs

- `dose-response-dataset`: Dose-response data from the critical study
- `critical-effect-summary`: The critical effect and its point of departure

## Outputs

- `reference-dose`: The derived RfD or BMD with units and basis
- `uncertainty-factor-table`: Table of applied uncertainty factors with justification for each

## Process

1. Select the point of departure (NOAEL, LOAEL, or BMDL)
2. Apply uncertainty factors for interspecies, intraspecies, duration, LOAEL-to-NOAEL, and data gaps
3. Calculate the reference dose by dividing the point of departure by the composite uncertainty factor
4. Document the rationale for each factor

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
