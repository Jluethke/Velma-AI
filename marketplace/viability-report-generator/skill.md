# Viability Report Generator

Compile all viability assay results into a structured pharmacology report.

## Inputs

- `potency-ranking`: Compound ranking with IC50 values
- `z-factor`: Assay quality scores
- `dose-response-fit`: Fitted curves and parameters

## Outputs

- `viability-report`: Final report with dose-response curves, potency table, and quality assessment
- `data-tables`: All raw and normalized data with fit parameters for archival

## Process

1. Assemble dose-response curve overlays and the potency ranking table
2. Include assay quality metrics and any plate exclusions with justification
3. Write the results interpretation identifying lead compounds and next steps
4. Package all raw plate data, normalized values, and fit parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
