# Data Provenance Tracer

Trace the data from its raw source through every transformation to the final reported values.

## Inputs

- `supplementary-materials`: code and data files
- `published-paper`: methods section describing the pipeline

## Outputs

- `provenance-chain`: ordered list of every data transformation from raw to reported, with file references
- `provenance-gaps`: steps described in the paper but not present in the code or data

## Process

1. Map the analysis pipeline from the methods section: raw data, cleaning, feature engineering, analysis, figure generation
2. Match each described step to a script or code block in the supplementary materials
3. Identify any steps where the description does not match the code or where code is missing
4. Document the provenance chain with input files, scripts, and output files at each step

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
