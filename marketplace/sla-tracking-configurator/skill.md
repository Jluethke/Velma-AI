# Sla Tracking Configurator

Configure SLA tracking and breach alerts in the ticketing system.

## Inputs

- `sla-tiers`: Tier definitions with time targets
- `tier-assignment-rules`: Rules for customer-to-tier mapping

## Outputs

- `tracking-configuration`: SLA tracking rules configured in the system
- `alert-configuration`: Breach and warning alert settings

## Process

1. Configure SLA clocks in the ticketing system per tier.
2. Set warning alerts at 75% of the time target.
3. Set breach alerts at 100% of the time target.
4. Configure escalation actions on breach.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
