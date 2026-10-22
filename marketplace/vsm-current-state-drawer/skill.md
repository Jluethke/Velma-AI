# Vsm Current State Drawer

Draw the current state value stream map.

## Inputs

- `process-data`: Process step data
- `information-flow`: Scheduling and signal data

## Outputs

- `current-state-map`: Complete current state VSM
- `timeline`: Lead time and value-added time calculations

## Process

1. Draw the material flow from left to right with standard VSM icons
2. Add the information flow across the top
3. Calculate lead time (sum of inventory days) and value-added time (sum of cycle times)
4. Compute the value-added ratio

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
