# Time Entry Review

Review time entries for accuracy and completeness before invoicing.

## Inputs

- `time-entries`: Raw time entries for the billing period
- `running-total`: Running totals

## Outputs

- `verified-entries`: Reviewed and corrected time entries ready for invoicing
- `period-summary`: Summary of hours by task, billable vs non-billable, and total amount

## Process

1. Pull all entries for the billing period and check for missing days or gaps.
2. Verify that each entry has a clear description and correct task assignment.
3. Correct any duplicate or miscategorized entries.
4. Calculate the period total and compare against the budget or retainer allocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
