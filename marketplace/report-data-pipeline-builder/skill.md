# Report Data Pipeline Builder

Build the automated data pipeline for the report.

## Inputs

- `report-catalog`: Report details including data sources
- `automation-candidates`: Which reports to automate first

## Outputs

- `data-pipeline-spec`: Specification of the automated data extraction and transformation
- `pipeline-validation`: Comparison of automated output against the last manual report

## Process

1. For the top candidate, map the data sources and transformations.
2. Build the extraction and transformation pipeline.
3. Run the pipeline and compare output against the most recent manual report.
4. Fix any discrepancies until the outputs match.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
