# Thermal Reference Comparison

Compare measured thermal properties against literature values and reference materials to validate the results.

## Inputs

- `thermal-profile`: Unified thermal property summary
- `material-description`: Material identity for literature lookup

## Outputs

- `reference-comparison-table`: Side-by-side measured vs literature values with sources
- `conformance-assessment`: Whether the material meets specification or matches expected grade

## Process

1. Look up published thermal property data for the material grade in handbooks and databases.
2. Build a comparison table: measured vs reference for each property (Tg, Tm, Td, modulus).
3. Flag deviations beyond expected measurement uncertainty.
4. Assess whether deviations indicate a different grade, aging, or processing history.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
