# Kyc Document Collector

Collect customer identification documents and verify completeness.

## Inputs

- `customer-information`: Name, address, date of birth, and entity type
- `jurisdiction`: Country or region for regulatory requirements

## Outputs

- `identity-documents`: Collected identification documents
- `document-checklist`: Checklist of required vs received documents

## Process

1. Determine required documents based on customer type and jurisdiction.
2. Collect government-issued ID, proof of address, and entity documents.
3. Verify document completeness against the checklist.
4. Flag missing or expired documents for follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
