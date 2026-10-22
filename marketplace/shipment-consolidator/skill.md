# Shipment Consolidator

Consolidate shipments where possible to reduce cost.

## Inputs

- `shipment-profiles`: Structured profiles for each shipment
- `mode-recommendations`: Recommended shipping mode for each shipment

## Outputs

- `consolidated-plan`: Consolidated shipment groupings
- `savings-estimate`: Estimated cost savings from consolidation

## Process

1. Identify shipments with compatible routes and timing
2. Group shipments that fit within carrier capacity
3. Calculate the cost savings from each consolidation
4. Produce the consolidated plan

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
