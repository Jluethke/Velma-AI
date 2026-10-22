# Contract Approval Router

Route the negotiated contract through the internal approval chain.

## Inputs

- `negotiated-contract`: The final negotiated contract
- `negotiation-log`: Negotiation history for context

## Outputs

- `approved-contract`: The contract approved for execution
- `approval-record`: Record of all approvals with dates and any conditions

## Process

1. Identify the required approvers based on contract value, type, and risk level.
2. Route the contract with the key terms summary and negotiation log.
3. Track approval status and follow up on pending approvals.
4. Record all approvals and any conditions imposed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
