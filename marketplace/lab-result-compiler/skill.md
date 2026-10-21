# Lab Result Compiler

Compile laboratory analytical results: match to sample IDs, check detection limits, flag QA/QC issues, and produce the results table.

## Inputs

- `lab-reports`: Analytical results from the laboratory with QA/QC data
- `field-data`: Field measurements to merge with lab results

## Outputs

- `compiled-results`: Complete dataset with field and lab results merged by site and date
- `qaqc-summary`: Blank results, duplicate precision, spike recoveries, and holding time compliance

## Process

1. Match lab results to field samples by sample ID.
2. Merge field measurements with lab results into a single table per site.
3. Check QA/QC: blank contamination, duplicate RPD, matrix spike recovery, holding time compliance.
4. Handle non-detects: report as less-than the detection limit, note the method used for statistical treatment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
