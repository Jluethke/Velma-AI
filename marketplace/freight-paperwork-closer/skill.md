# Freight Paperwork Closer

Manage the paperwork and close the load.

## Inputs

- `tracking-updates`: Transit tracking data
- `exception-log`: Exception log

## Outputs

- `completed-documents`: Bill of lading, proof of delivery, and invoice package
- `brokerage-record`: Complete brokerage record for the shipment

## Process

1. Collect the signed bill of lading (BOL) and proof of delivery (POD).
2. Verify delivery against the original load details (on time, no damage, correct count).
3. Process the carrier invoice and issue payment per terms.
4. Invoice the shipper and compile the complete brokerage record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
