# Chronological Data Compilation

Compile all dated horizons from the core including radiocarbon, tephra, and paleomagnetic tie points.

## Inputs

- `core-log`: Core description with depths, lithology, and sampling locations
- `dating-results`: Raw dating results: radiocarbon ages, tephra IDs, paleomagnetic reversals, other markers

## Outputs

- `dated-horizons-table`: Table of all dated points: depth, age, uncertainty, dating method, and material dated
- `outlier-candidates`: Dates flagged as potential outliers based on stratigraphic inversion or large uncertainty

## Process

1. Enter each date with its depth, reported age, uncertainty, and method
2. Check for stratigraphic inversions (younger dates below older dates)
3. Flag dates on reworked material or with anomalously large uncertainties
4. Add any event horizons (tephra layers, paleomagnetic boundaries) with their known ages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
