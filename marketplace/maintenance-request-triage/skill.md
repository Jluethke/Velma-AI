# Maintenance Request Triage

Receive and triage incoming maintenance requests from tenants or property managers.

## Inputs

- `maintenance-contract`: Contract scope and SLA for the property
- `sla-targets`: Response time targets by priority

## Outputs

- `triaged-request`: Request classified by priority, trade, and estimated scope
- `authorization-status`: Whether the repair is pre-authorized or requires owner approval

## Process

1. Receive the request through the tenant portal, phone, or property manager.
2. Classify by trade (plumbing, electrical, HVAC, appliance, structural, pest).
3. Assign priority based on the issue (water leak = emergency, running toilet = routine).
4. Check authorization limits and request owner approval if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
