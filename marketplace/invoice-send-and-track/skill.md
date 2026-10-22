# Invoice Send And Track

Send the invoice and track payment status.

## Inputs

- `invoice-document`: The completed invoice
- `invoice-number`: Invoice identifier

## Outputs

- `payment-status`: Current payment status (sent, viewed, paid, overdue)
- `billing-record`: Record of the invoice, send date, payment date, and amount received

## Process

1. Send the invoice to the client via the agreed method (email, invoicing platform).
2. Log the send date and payment due date.
3. Monitor for payment receipt and match against the invoice amount.
4. If payment is overdue, send a reminder at the agreed intervals (3 days, 7 days, 14 days).
5. Record the final payment date and amount, and note any discrepancies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
