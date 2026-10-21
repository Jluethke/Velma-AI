# Contamination Evaluator

Evaluate soil contamination: compare heavy metals and organic pollutants against regulatory screening levels and background concentrations.

## Inputs

- `organized-results`: Contaminant concentrations (metals, PAHs, TPH, pesticides)
- `regulatory-standards`: Screening levels for the jurisdiction and land use (residential, industrial)

## Outputs

- `contamination-assessment`: Each contaminant compared to screening levels with exceedance flagged
- `risk-classification`: Site classification (clean, potentially contaminated, contaminated) based on results

## Process

1. Compare each contaminant concentration to the applicable screening level.
2. Flag any concentration exceeding the screening level for the designated land use.
3. Compare to local background concentrations to distinguish natural enrichment from contamination.
4. Classify the site based on the number and magnitude of exceedances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
