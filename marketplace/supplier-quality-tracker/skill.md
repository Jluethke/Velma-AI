# Supplier Quality Tracker

Track supplier quality performance over time.

## Inputs

- `ncr-process`: NCR data
- `switching-rules`: Inspection level switching rules

## Outputs

- `supplier-scorecard`: Quality performance by supplier (lot acceptance rate, PPM)
- `incoming-inspection-protocol`: Complete incoming inspection protocol document

## Process

1. Track lot acceptance rate and defect PPM by supplier and material
2. Apply switching rules to adjust inspection levels
3. Generate supplier scorecards for quarterly review
4. Compile the complete incoming inspection protocol

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
