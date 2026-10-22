# Invoice Po Validator

Validate the extracted invoice data against the corresponding purchase order.

## Inputs

- `extracted-fields`: Structured invoice data
- `extraction-confidence`: Confidence scores for extracted fields

## Outputs

- `validation-result`: Pass, fail, or exception with details on each mismatch
- `variance-report`: Line-by-line comparison of invoice versus PO

## Process

1. Look up the purchase order by PO number.
2. Compare invoice line items against PO line items (quantities, prices, descriptions).
3. Flag any variances that exceed the tolerance threshold.
4. Produce the validation result and variance report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
