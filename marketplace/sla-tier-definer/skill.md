# Sla Tier Definer

Define SLA tiers with response and resolution time targets.

## Inputs

- `customer-segments`: Customer groups (enterprise, business, free)
- `support-capacity`: Available support resources and hours

## Outputs

- `sla-tiers`: Defined SLA tiers with time targets per severity
- `tier-assignment-rules`: Rules for assigning customers to tiers

## Process

1. Define the tiers based on customer segment or plan.
2. Set first-response and resolution time targets for each severity within each tier.
3. Document the tier assignment rules.
4. Validate that targets are achievable with current capacity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
