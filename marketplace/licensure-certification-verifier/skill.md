# Licensure Certification Verifier

Verify current licensure and board certification status.

## Inputs

- `application-package`: Provider's credentialing documents

## Outputs

- `license-status`: Active, inactive, or restricted for each license
- `board-cert-status`: Board certification status and expiration

## Process

1. Query the state licensing board for current status and actions.
2. Verify board certification through the certifying body.
3. Check DEA registration if prescribing privileges are requested.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
