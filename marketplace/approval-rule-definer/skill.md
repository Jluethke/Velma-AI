# Approval Rule Definer

Define the approval rules: who approves what, at what thresholds, and in what order.

## Inputs

- `document-types`: The types of documents that require approval
- `approval-policies`: Organizational policies governing approval authority and thresholds

## Outputs

- `approval-matrix`: Matrix mapping document types and amounts to approvers and escalation paths
- `approval-sla`: Response time expectations for each approval level

## Process

1. List the document types that require approval (invoices, contracts, expense reports, purchase requests).
2. Define the approval thresholds and routing for each type.
3. Set the escalation path for overdue approvals.
4. Document the SLA for each approval level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
