# Crude Extract Bioactivity Screen

Screen the crude extract for biological activity to confirm the starting material is active.

## Inputs

- `crude-extract`: Source material extract (plant, microbial, marine) in a defined solvent
- `bioassay-protocol`: Target activity assay: antimicrobial, cytotoxic, enzyme inhibition, or other

## Outputs

- `crude-activity-result`: Activity measurement (IC50, MIC, percent inhibition) for the crude extract
- `fractionation-decision`: Go/no-go decision and recommended fractionation strategy based on activity level

## Process

1. Dissolve the crude extract at a standard concentration series
2. Run the bioassay with positive and negative controls
3. Determine the dose-response curve and activity metric
4. Decide whether the activity warrants fractionation and which method to use

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
