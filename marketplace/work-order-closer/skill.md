# Work Order Closer

Close the work order, update inventory, and trigger invoicing.

## Inputs

- `job-status-log`: Complete job timeline
- `completion-report`: Work performed and parts consumed

## Outputs

- `closed-work-order`: Finalized work order with all costs, time, and resolution details
- `dispatch-record`: Complete dispatch record for reporting and analysis

## Process

1. Reconcile the parts used against truck inventory and reorder as needed.
2. Calculate the final job cost (labor, parts, travel).
3. Close the work order and trigger the invoice.
4. Update the customer's equipment record and warranty status.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
