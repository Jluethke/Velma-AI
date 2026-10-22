# Review Response Protocol Designer

Design the review response protocol.

## Inputs

- `reputation-snapshot`: The current reputation status
- `critical-reviews`: Reviews needing immediate response

## Outputs

- `response-protocol`: Response protocol for positive, negative, and neutral reviews with templates and SLA
- `escalation-rules`: Rules for escalating reviews to management, legal, or PR

## Process

1. Write response templates for positive reviews (thank, personalize, invite back).
2. Write response templates for negative reviews (acknowledge, empathize, offer resolution).
3. Set the response SLA (e.g., respond within 24 hours for negative, 48 hours for positive).
4. Define escalation triggers (legal threats, viral reviews, factual disputes).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
