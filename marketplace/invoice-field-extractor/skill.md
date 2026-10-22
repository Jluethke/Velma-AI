# Invoice Field Extractor

Extract key fields from the invoice: vendor, amount, date, line items, and PO number.

## Inputs

- `received-invoice`: The invoice file to extract from

## Outputs

- `extracted-fields`: Structured data: vendor, invoice number, date, due date, line items, total amount, PO number
- `extraction-confidence`: Confidence score for each extracted field

## Process

1. Parse the invoice to identify vendor name, invoice number, date, and due date.
2. Extract line items with descriptions, quantities, unit prices, and amounts.
3. Identify the PO number or reference if present.
4. Calculate the invoice total and compare against the stated total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
