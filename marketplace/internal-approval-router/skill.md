# Internal Approval Router

Route the quote for internal approvals from pricing, legal, and finance.

## Inputs

- `draft-quote`: Quote requiring approval
- `approval-needed`: Which approvals are required

## Outputs

- `approved-quote`: Quote with all approvals obtained
- `approval-conditions`: Any conditions or modifications from approvers

## Process

1. Route to pricing for discount approval if above threshold.
2. Route to legal for non-standard terms.
3. Route to finance for payment terms or credit approval.
4. Collect all approvals and any conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
