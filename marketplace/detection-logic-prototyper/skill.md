# Detection Logic Prototyper

Prototype the detection logic and test it against historical data.

## Inputs

- `data-requirements`: Required log sources and fields
- `data-availability-assessment`: Available vs missing data sources

## Outputs

- `prototype-detection`: Draft detection rule or query
- `historical-test-results`: Results from running the prototype against historical log data

## Process

1. Write the initial detection logic targeting the technique's observable artifacts
2. Run the prototype against historical data covering the last 30 to 90 days
3. Review matches to separate true positives from false positives
4. Iterate on the logic to reduce noise

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
