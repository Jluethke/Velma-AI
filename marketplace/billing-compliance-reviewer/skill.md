# Billing Compliance Reviewer

Review time entries for compliance with billing guidelines before generating the pre-bill.

## Inputs

- `time-entries`: Raw time entries for the billing period
- `entry-warnings`: Flagged entries from the logger

## Outputs

- `reviewed-entries`: Time entries that passed compliance review
- `adjustment-log`: Record of any write-downs, write-offs, or description edits

## Process

1. Review each flagged entry for billing guideline compliance.
2. Edit descriptions that are too vague or contain block billing.
3. Apply write-downs for excessive time on routine tasks.
4. Produce the reviewed entry set and the adjustment log.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
