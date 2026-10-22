# Collections Follow Up Runner

Follow up on overdue accounts with escalating collection actions.

## Inputs

- `overdue-list`: Overdue invoices requiring follow-up
- `collection-policy`: Company collection policy and escalation rules

## Outputs

- `collection-actions`: Log of collection actions taken
- `payment-commitments`: Customer payment commitments obtained

## Process

1. Send reminder notices for invoices 30 days overdue.
2. Make phone contact for invoices 60 days overdue.
3. Escalate to management or collections for invoices 90+ days overdue.
4. Document all communications and payment commitments received.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
