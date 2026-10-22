# Review Monitor Responder

Monitor incoming reviews and respond to negative reviews within SLA.

## Inputs

- `collection-flows`: Active review collection setup
- `collection-schedule`: Review request timing

## Outputs

- `review-responses`: Responses to reviews
- `escalation-log`: Reviews escalated for resolution

## Process

1. Aggregate reviews from all channels into a single dashboard.
2. Flag reviews that require a response (negative, questions, complaints).
3. Draft and post responses within the SLA.
4. Escalate unresolved issues to customer support.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
