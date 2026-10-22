# Escalation Tier Definition

Define the escalation tiers and the response time targets for each.

## Inputs

- `organization-structure`: Teams, roles, and management hierarchy
- `service-level-targets`: SLA and SLO response time commitments

## Outputs

- `tier-definitions`: Defined escalation tiers (L1, L2, L3, management) with roles and responsibilities
- `response-time-targets`: Response time targets for each tier and severity

## Process

1. Define three to four escalation tiers: L1 (first responder, on-call), L2 (subject matter expert), L3 (senior engineer or architect), management (director or VP).
2. Assign roles and teams to each tier.
3. Set response time targets: L1 acknowledges within 5 minutes for critical; L2 engaged within 15 minutes if L1 cannot resolve.
4. Document the responsibilities at each tier (L1 triages and communicates, L2 diagnoses, L3 resolves).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
