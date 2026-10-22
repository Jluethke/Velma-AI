# Diagnostic Update Notifier

Notify the customer when the diagnostic is complete and the estimate is ready.

## Inputs

- `confirmation-sent`: Prior confirmation for customer contact reference
- `customer-contact`: Customer contact information

## Outputs

- `update-sent`: Diagnostic update message sent with delivery status
- `authorization-request`: Request for customer authorization to proceed with the estimate

## Process

1. Compose the update message summarizing the diagnostic findings in plain language.
2. Include the total estimate amount and ask for authorization to proceed.
3. Send via the customer's preferred channel.
4. Log the outreach attempt and whether the customer responded.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
