# Donation Acknowledgment Sender

Issue acknowledgment letters and tax receipts for each donation.

## Inputs

- `processing-procedure`: How gifts are processed and recorded
- `internal-controls`: Controls over fund handling

## Outputs

- `acknowledgment-templates`: Letter templates for different gift types (cash, stock, in-kind, recurring)
- `acknowledgment-schedule`: When acknowledgments are sent (immediate, weekly batch, or threshold-based)

## Process

1. Create acknowledgment templates that meet IRS requirements: organization name, tax ID, gift amount, date, and statement of no goods or services received.
2. Set the acknowledgment schedule: immediate for online gifts, weekly batch for checks and cash.
3. For non-cash gifts (stock, property, in-kind), use the appropriate template with a description but no valuation.
4. Send each acknowledgment and log the send date in the donor record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
