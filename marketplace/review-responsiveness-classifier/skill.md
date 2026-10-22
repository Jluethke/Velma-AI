# Review Responsiveness Classifier

Review documents for responsiveness to the discovery request and privilege.

## Inputs

- `processed-data-set`: Data set ready for review
- `scope-document`: Search terms and responsiveness criteria

## Outputs

- `review-results`: Documents tagged as responsive, non-responsive, or privileged
- `privilege-log`: Log of documents withheld on privilege grounds

## Process

1. Apply search terms and analytics to prioritize documents for review.
2. Review documents for responsiveness to the discovery request.
3. Identify and tag privileged documents (attorney-client, work product).
4. Produce the privilege log with the required entries (date, author, recipient, subject, privilege asserted).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
