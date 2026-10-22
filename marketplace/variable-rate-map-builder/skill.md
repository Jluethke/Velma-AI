# Variable Rate Map Builder

Create variable-rate application maps from field data.

## Inputs

- `management-zones`: Zone map for the field
- `soil-data-layers`: Soil nutrient levels by zone

## Outputs

- `vra-maps`: Variable-rate prescription maps for seed, fertilizer, and lime
- `rate-justification`: Agronomic basis for each zone rate

## Process

1. Set target application rates for each zone based on soil data and yield goals.
2. Build the prescription file for the equipment controller.
3. Validate that rates stay within agronomic and equipment limits.
4. Document the agronomic justification for each zone rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
