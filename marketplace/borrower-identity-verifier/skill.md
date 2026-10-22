# Borrower Identity Verifier

Verify the borrower identity and supporting documents.

## Inputs

- `application-record`: The logged loan application
- `document-checklist`: Required documents to collect and verify

## Outputs

- `identity-verification-result`: Pass or fail with details on each verification check
- `verified-documents`: List of documents received and verified

## Process

1. Collect the required documents (pay stubs, tax returns, bank statements, ID).
2. Verify identity against government databases or third-party services.
3. Confirm document authenticity and flag any discrepancies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
