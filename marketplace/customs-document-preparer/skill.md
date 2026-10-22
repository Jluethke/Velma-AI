# Customs Document Preparer

Prepare customs documentation for the shipment.

## Inputs

- `hs-classifications`: HS codes assigned to each product
- `duty-schedule`: Applicable duty rates and tax amounts per product

## Outputs

- `customs-documents`: Commercial invoice, packing list, and certificate of origin
- `document-checklist`: Checklist of required documents by destination country

## Process

1. Prepare the commercial invoice with HS codes and values
2. Generate the packing list with weights and dimensions
3. Complete the certificate of origin if trade agreement applies
4. Verify all documents against the destination country requirements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
