# Germplasm Selection

Select germplasm entries for a field trial by screening available accessions against target traits, adaptation zone, and trial objectives.

## Inputs

- `trial-objective`: Breeding objective: yield, disease resistance, quality, stress tolerance, etc.
- `adaptation-zone`: Climate, soil type, and latitude of the trial site
- `available-accessions`: Germplasm collection or seed catalog to screen

## Outputs

- `selected-entries`: List of accessions chosen for the trial with pedigree and trait data
- `check-varieties`: Reference varieties serving as controls

## Process

1. Filter accessions by adaptation zone, maturity group, and availability of sufficient seed
2. Rank candidates by prior performance data for the target trait
3. Select check varieties representing the current commercial standard and a known susceptible control
4. Confirm seed quantity and viability for all selected entries

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
