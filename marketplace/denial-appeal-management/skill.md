# Denial Appeal Management

Handle claim denials by analyzing the reason, correcting errors, and filing appeals.

## Inputs

- `denial-list`: Denied line items with reason codes
- `adjudicated-claim`: Full claim record for context

## Outputs

- `billing-record`: Final billing record with payment, adjustments, and appeal outcomes
- `denial-trends`: Summary of denial patterns for process improvement

## Process

1. Categorize each denial by reason (eligibility, authorization, coding, timely filing, medical necessity).
2. For correctable denials, fix the error and resubmit the claim.
3. For clinical denials, prepare and submit the appeal with supporting documentation.
4. Track appeal outcomes and summarize denial trends for process improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
