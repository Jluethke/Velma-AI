# Tax Document Collector

Gather all income documents, deduction records, and prior-year returns.

## Inputs

- `taxpayer-info`: Taxpayer identification and filing status
- `tax-year`: Tax year being prepared

## Outputs

- `document-inventory`: Complete list of collected tax documents
- `missing-items`: List of documents still needed

## Process

1. Request all W-2s, 1099s, K-1s, and other income documents.
2. Collect deduction records (mortgage interest, charitable donations, medical expenses).
3. Obtain the prior-year return for reference and carryforward items.
4. Verify all documents are received and flag missing items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
