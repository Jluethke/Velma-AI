# Invoice Receiver

Receive and log an inbound invoice from email, upload, or scan.

## Inputs

- `invoice-source`: The raw invoice (email attachment, uploaded file, or scanned image)
- `vendor-name`: The vendor or supplier name if known

## Outputs

- `received-invoice`: The invoice file registered in the processing queue
- `receipt-timestamp`: When the invoice was received and logged

## Process

1. Accept the invoice from the source channel (email, upload portal, or scanner).
2. Assign a unique invoice tracking number.
3. Log the receipt with timestamp and source channel.
4. Place the invoice in the processing queue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
