# Regulatory Comparator

Compare monitoring results against applicable regulatory standards, guidelines, and permit limits to assess compliance status.

## Inputs

- `qc-dataset`: Quality-controlled monitoring data
- `regulatory-standards`: Applicable federal, state, and local standards with averaging periods
- `permit-limits`: Facility-specific permit conditions and reporting requirements

## Outputs

- `compliance-summary`: Compliance status per parameter and standard with exceedance counts
- `design-value-calculations`: Regulatory design values (e.g. 98th percentile, 4th-highest daily max)
- `reporting-forms`: Pre-filled regulatory reporting templates with required statistics

## Process

1. Identify all applicable standards and their averaging periods for each measured parameter
2. Calculate the regulatory form of the statistic for each standard (annual mean, percentile, max, etc.)
3. Compare calculated values against standard thresholds and flag exceedances
4. Compute multi-year design values where standards require rolling averages
5. Prepare regulatory reporting forms with required data completeness documentation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
