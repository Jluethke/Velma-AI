# Invoice Generation

Generate an invoice from verified time entries.

## Inputs

- `verified-entries`: Reviewed time entries
- `period-summary`: Hours and amount summary

## Outputs

- `invoice-document`: The generated invoice with line items, amounts, and payment terms
- `invoice-number`: Unique invoice identifier

## Process

1. Create the invoice with your business details, client details, invoice number, and date.
2. List the line items (hours by task or phase, rate, and subtotal for each).
3. Add any expenses or fixed-fee items.
4. Include the payment terms (net 15, net 30), accepted payment methods, and late payment policy.
5. Review the invoice for accuracy before sending.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
