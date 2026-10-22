# Quote Issuer

Issue the formal quote to the broker or applicant with all terms and conditions.

## Inputs

- `quote-terms`: Proposed premium, deductible, and coverage terms
- `pricing-worksheet`: Supporting premium calculation details

## Outputs

- `formal-quote`: The quote document delivered to the broker or applicant
- `quote-expiration-date`: The date the quote expires if not accepted

## Process

1. Compile the quote letter with coverage summary, premium, deductible, and conditions.
2. Set the quote expiration date (typically 30 days).
3. Deliver the quote to the broker or applicant.
4. Log the quote in the tracking system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
