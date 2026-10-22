# Identity Verification Screener

Verify customer identity against databases and screen against sanctions and PEP lists.

## Inputs

- `identity-documents`: Collected identification documents
- `customer-information`: Customer details for screening

## Outputs

- `verification-result`: Identity verification outcome (pass, fail, manual review)
- `screening-hits`: Any matches against sanctions, PEP, or adverse media lists

## Process

1. Run identity verification against government and commercial databases.
2. Screen the customer name and aliases against OFAC, EU, and UN sanctions lists.
3. Screen against politically exposed persons (PEP) databases.
4. Check for adverse media related to financial crime.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
