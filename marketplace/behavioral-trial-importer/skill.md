# Behavioral Trial Importer

Import trial-level behavioral data and verify its structure against the experimental design.

## Inputs

- `data-files`: CSV or log files with one row per trial
- `design-spec`: Experimental factors, levels, counterbalancing scheme, and expected trial counts

## Outputs

- `validated-trials`: Trial table with all factors, responses, and timing verified
- `import-summary`: Subject count, trial count per condition, and missing data rate

## Process

1. Read data files and standardize column names to match the design specification.
2. Check that every subject has the expected number of trials per condition.
3. Flag trials with reaction times below 100ms (anticipatory) or above a reasonable ceiling.
4. Report missing data rates per subject and per condition.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
