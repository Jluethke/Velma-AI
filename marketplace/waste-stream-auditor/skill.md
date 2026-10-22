# Waste Stream Auditor

Audit the current waste streams to establish a baseline.

## Inputs

- `facility-description`: Description of the facility, operations, and current waste handling
- `waste-hauler-data`: Current waste hauler invoices and tonnage reports

## Outputs

- `waste-baseline`: Baseline waste generation by stream (landfill, recycling, compost, hazardous) with volumes and costs
- `contamination-findings`: Contamination issues found (recyclables in trash, trash in recycling)

## Process

1. Collect waste hauler invoices, tonnage reports, and disposal records for the past 12 months.
2. Conduct a physical waste sort to characterize the composition of each stream.
3. Calculate the current diversion rate (recycling + compost as a percentage of total waste).
4. Identify contamination issues and misrouted materials.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
