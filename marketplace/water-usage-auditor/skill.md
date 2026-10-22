# Water Usage Auditor

Audit current water usage by source and application.

## Inputs

- `facility-water-data`: Water billing data and facility description
- `water-systems`: Description of water-using systems (fixtures, irrigation, cooling, process)

## Outputs

- `water-baseline`: Baseline water consumption by end use (domestic, irrigation, cooling, process)
- `waste-points`: Identified points of water waste (leaks, overwatering, inefficient fixtures)

## Process

1. Collect 12 months of water billing data and calculate average monthly consumption.
2. Estimate the breakdown by end use: domestic (restrooms, kitchens), irrigation, cooling towers, process.
3. Inspect for leaks, running fixtures, and overwatering.
4. Compare consumption per square foot or per occupant to benchmarks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
