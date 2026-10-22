# Auth Submission Tracking

Submit the authorization request and track it through the payer's review process.

## Inputs

- `auth-package`: Complete authorization submission
- `timeline`: Expected turnaround time

## Outputs

- `auth-status`: Current authorization status (submitted, in review, approved, denied, peer review requested)
- `auth-tracking-number`: Payer's reference number for the authorization request

## Process

1. Submit the authorization package through the payer's required channel.
2. Record the submission date, tracking number, and expected decision date.
3. Follow up with the payer if no response by the expected date.
4. Respond to any payer requests for additional information within 24 hours.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
