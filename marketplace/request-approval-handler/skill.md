# Request Approval Handler

Route the request through the approval chain if required.

## Inputs

- `validated-request`: The validated request
- `fulfillment-path`: Fulfillment routing and approval requirements

## Outputs

- `approved-request`: Approved request ready for fulfillment
- `approval-record`: Record of who approved and when

## Process

1. Determine if the request requires approval.
2. If yes, send to the approver with the request details and cost.
3. Track the approval timeline against the SLA.
4. Record the approval or rejection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
