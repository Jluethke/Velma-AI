# Benevolence Distribution Handler

Distribute the approved assistance and document the disbursement.

## Inputs

- `application-decision`: Approved request with amount and type
- `verification-notes`: Supporting documentation

## Outputs

- `disbursement-record`: Payment made: amount, payee, method, date, and fund source
- `applicant-notification`: Communication sent to the applicant about the decision and next steps

## Process

1. For approved requests, issue payment directly to the vendor (landlord, utility company, provider) rather than to the applicant.
2. Record the disbursement: amount, payee, check number or transfer ID, date, and which fund was charged.
3. Notify the applicant of the decision, amount, and how payment was made.
4. If denied, communicate the reason and provide referrals to other assistance resources.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
