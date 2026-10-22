# Msa Study Designer

Design the Gage R&R study.

## Inputs

- `measurement-system`: The gage, fixture, and method to evaluate
- `tolerance`: Specification tolerance for the measured characteristic

## Outputs

- `study-design`: Crossed or nested design with operators, parts, and repeats
- `data-collection-form`: Form for recording measurements

## Process

1. Select the study type: crossed (all operators measure all parts) or nested
2. Select the number of operators (typically 3), parts (typically 10), and repeats (typically 3)
3. Select parts that span the process range
4. Prepare the data collection form with randomized measurement order

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
