# Risk Quotient Calculator

Compute the hazard quotient or margin of exposure by comparing the exposure estimate to the reference dose.

## Inputs

- `exposure-estimate`: Quantified exposure by pathway
- `reference-dose`: The derived reference dose or benchmark dose

## Outputs

- `risk-characterization`: Hazard quotient, margin of exposure, and risk classification
- `risk-drivers`: Identification of the pathways and populations driving the risk

## Process

1. Divide the exposure estimate by the reference dose to compute the hazard quotient
2. Classify risk as acceptable (HQ < 1) or of concern (HQ >= 1)
3. Identify which pathways and populations contribute most to the total risk
4. Compute the margin of exposure for cancer endpoints where applicable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
