# Medication Order Comparator

Compare the collected lists against admission or transfer orders.

## Inputs

- `source-med-lists`: Medication lists from all sources
- `current-orders`: Active medication orders at the receiving facility

## Outputs

- `discrepancy-list`: All identified discrepancies with classification
- `matched-medications`: Medications confirmed as consistent across sources

## Process

1. Align medications by name, dose, route, and frequency.
2. Flag omissions, duplications, and dose differences.
3. Classify each discrepancy by type and clinical significance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
