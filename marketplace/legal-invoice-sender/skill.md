# Legal Invoice Sender

Generate and send the final invoice to the client.

## Inputs

- `approved-bill`: The approved invoice
- `approval-notes`: Notes on final adjustments

## Outputs

- `sent-invoice`: The final invoice as sent to the client with delivery confirmation
- `billing-record`: Record of the invoice in the billing system (amount, date, matter, status)

## Process

1. Format the invoice per client requirements (LEDES, custom template, standard).
2. Send the invoice to the client via the agreed delivery method.
3. Record the invoice in the billing system with status set to outstanding.
4. Start the payment tracking cycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
