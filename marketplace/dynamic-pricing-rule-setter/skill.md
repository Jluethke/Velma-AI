# Dynamic Pricing Rule Setter

Set dynamic pricing rules based on demand forecast and competitive rates.

## Inputs

- `demand-forecast`: Predicted demand by segment and date
- `competitive-rates`: Current rates from comparable properties

## Outputs

- `pricing-rules`: Dynamic pricing rules by room type and date
- `rate-floor-ceiling`: Minimum and maximum rate boundaries

## Process

1. Set rate floors based on cost-per-occupied-room.
2. Define ceiling rates by room type and segment.
3. Create rules that adjust rates based on booking pace.
4. Validate rules against competitive positioning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
