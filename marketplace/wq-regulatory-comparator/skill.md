# Wq Regulatory Comparator

Compare all results against applicable water quality standards and identify exceedances.

## Inputs

- `physical-results`: Physical parameter measurements
- `chemical-results`: Chemical parameter measurements
- `biological-results`: Biological indicator measurements

## Outputs

- `compliance-table`: Each parameter compared to its standard with pass/exceed flag
- `exceedance-summary`: Count and severity of standard exceedances by parameter group

## Process

1. Match each parameter to the applicable standard for the water body classification.
2. Flag any parameter exceeding its standard, noting the magnitude of exceedance.
3. Classify exceedances by severity (marginal, moderate, severe).
4. Identify spatial or temporal patterns in exceedances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
