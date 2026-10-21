# Biomarker Cohort Assembler

Assemble the case-control cohort for biomarker evaluation, applying inclusion and exclusion criteria.

## Inputs

- `clinical-question`: The structured clinical question defining cases and controls
- `sample-source`: The biobank, registry, or clinical site providing specimens

## Outputs

- `study-cohort`: Enrolled cases and controls with demographics and clinical data
- `cohort-characteristics`: Table 1: baseline characteristics by group

## Process

1. Apply inclusion and exclusion criteria to identify eligible cases and controls
2. Match controls on relevant confounders (age, sex, comorbidities) if appropriate
3. Verify the reference standard diagnosis for each case
4. Compile demographics and clinical characteristics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
