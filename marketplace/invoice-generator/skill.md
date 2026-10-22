# Invoice Generator

Generate and send invoices based on completed work or delivered goods.

## Inputs

- `billing-data`: Data for invoices (customer, amounts, terms, descriptions)
- `invoice-template`: Standard invoice template with company details

## Outputs

- `issued-invoices`: List of invoices generated with amounts and due dates
- `invoice-ledger-entries`: Journal entries to record the receivables

## Process

1. Validate billing data against contracts or purchase orders.
2. Generate invoices with correct terms, amounts, and payment instructions.
3. Send invoices to customers via the designated channel.
4. Post the receivable entries to the general ledger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
