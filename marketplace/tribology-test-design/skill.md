# Tribology Test Design

Select the tribology test configuration and conditions to match the application's contact geometry, load, speed, and environment.

## Inputs

- `application-conditions`: Load, speed, temperature, lubrication, and contact type in the real application
- `materials-to-test`: List of material pairs (surface and counter-body) to evaluate

## Outputs

- `test-configuration`: Pin-on-disk, ball-on-flat, reciprocating, or block-on-ring with all parameters
- `test-matrix`: Number of replicates, material combinations, and condition variations

## Process

1. Match the application contact type to a standard test geometry (ASTM G99, G133, or similar).
2. Select load, speed, and sliding distance to represent the application or to standardize for comparison.
3. Specify the environment (ambient air, controlled humidity, temperature, or lubricant).
4. Define the number of replicates per condition for statistical confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
