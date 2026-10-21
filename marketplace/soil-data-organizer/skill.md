# Soil Data Organizer

Organize soil laboratory results: match sample IDs to locations, verify units, flag results outside plausible ranges, and structure for interpretation.

## Inputs

- `lab-results`: Raw laboratory data with sample IDs, analytes, values, and units
- `sampling-metadata`: Sample locations, depths, dates, and land use context

## Outputs

- `organized-results`: Lab results matched to locations with consistent units
- `quality-flags`: Results outside plausible ranges or with QA/QC issues

## Process

1. Match each lab result to its sampling location and depth.
2. Convert all results to consistent units (mg/kg for metals, cmol/kg for CEC, etc.).
3. Flag results that fall outside physically plausible ranges.
4. Check QA/QC: duplicates within tolerance, blanks below detection, spikes within recovery limits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
