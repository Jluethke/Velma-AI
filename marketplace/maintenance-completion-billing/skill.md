# Maintenance Completion Billing

Close the work order, document the repair, and invoice the property owner.

## Inputs

- `dispatch-record`: Dispatched job with technician
- `maintenance-contract`: Contract pricing and billing terms

## Outputs

- `completed-work-order`: Closed work order with photos, parts list, labor time, and tenant sign-off
- `maintenance-service-record`: Complete property maintenance service record for the period

## Process

1. Record the work performed with before/after photos.
2. Log parts used and labor time for cost calculation.
3. Get tenant confirmation that the issue is resolved.
4. Invoice per contract terms (included in retainer, or per-call billing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
