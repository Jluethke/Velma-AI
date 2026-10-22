# Maintenance Contract Setup

Define the maintenance service contract with scope, SLA, and pricing for a property or portfolio.

## Inputs

- `property-portfolio`: Properties covered (type, unit count, age, systems)
- `service-scope`: Maintenance categories included (HVAC, plumbing, electrical, general, grounds)

## Outputs

- `maintenance-contract`: Service contract with scope, response times, pricing, and exclusions
- `sla-targets`: SLA targets for response and resolution by priority level

## Process

1. Define the included maintenance categories and what falls outside scope.
2. Set the response time SLA by priority (emergency: 1 hour, urgent: 4 hours, routine: 48 hours).
3. Set the pricing model (monthly retainer, per-call, or hybrid).
4. Define the authorization limits (repairs under X dollars proceed without approval).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
