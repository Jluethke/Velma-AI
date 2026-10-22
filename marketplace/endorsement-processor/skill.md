# Endorsement Processor

Process mid-term endorsements and policy changes.

## Inputs

- `issued-policy`: The current policy to be endorsed
- `change-request`: The requested change (add coverage, change limits, update insured info, add location)

## Outputs

- `endorsed-policy`: The updated policy reflecting the endorsement
- `premium-adjustment`: The premium change resulting from the endorsement (additional or return premium)

## Process

1. Validate the requested change against underwriting guidelines.
2. Calculate the pro-rata premium adjustment for the remaining policy term.
3. Issue the endorsement and update the policy in the system.
4. Deliver the endorsement documents and updated invoice.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
