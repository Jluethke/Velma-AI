# Trouble Resolution Verifier

Verify the fix with the customer and close the ticket.

## Inputs

- `repair-result`: Repair result
- `repair-notes`: Repair documentation

## Outputs

- `customer-confirmation`: Customer confirmation that the issue is resolved
- `trouble-resolution-record`: Complete trouble ticket resolution record

## Process

1. Contact the customer to confirm the service is restored.
2. Run a final end-to-end test to verify performance meets the SLA.
3. Close the ticket with the resolution details and duration.
4. Update the known issues database if the fault was new.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
