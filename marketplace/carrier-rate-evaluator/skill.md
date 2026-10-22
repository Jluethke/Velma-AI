# Carrier Rate Evaluator

Evaluate carrier options and rates across shipping modes.

## Inputs

- `shipment-profiles`: Structured profiles for each shipment
- `constraint-summary`: Time, weight, and routing constraints

## Outputs

- `carrier-comparison`: Rate and service comparison across carriers
- `mode-recommendations`: Recommended shipping mode for each shipment

## Process

1. Request quotes from LTL, FTL, parcel, and intermodal carriers
2. Compare rates, transit times, and service levels
3. Score each option against the constraints
4. Rank carriers by cost and reliability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
