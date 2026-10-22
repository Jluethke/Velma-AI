# Work Order Intake

Receive and classify a maintenance work order from a tenant.

## Inputs

- `tenant-request`: Maintenance request from the tenant with description and photos
- `property-info`: Unit and property details

## Outputs

- `work-order`: Classified work order with urgency level
- `urgency-classification`: Emergency, urgent, or routine classification

## Process

1. Record the tenant request with unit number, description, and photos.
2. Classify by urgency: emergency (safety, flooding), urgent (no heat, no water), routine (cosmetic, minor).
3. Assign a work order number and notify the tenant of receipt.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
