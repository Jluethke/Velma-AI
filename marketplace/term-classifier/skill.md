# Term Classifier

Classify every contract term as standard (accept), high-impact (negotiate), or deal-breaker (must change or walk away).

## Inputs

- `contract-terms`: The proposed contract terms
- `deal-priorities`: What matters most in this deal: price, liability, timeline, exclusivity, termination, IP, indemnification

## Outputs

- `term-classification`: Each term classified: standard (accept as-is), high-impact (worth negotiating), or deal-breaker (non-negotiable requirement)
- `negotiation-focus-list`: The 3-7 terms worth negotiating, ranked by impact

## Process

1. Read every term. For each, ask: if this term were different, would it meaningfully change the value or risk of this deal?
2. Standard terms: boilerplate language, governing law, notice provisions, standard warranty. Accept these unless they contain unusual provisions.
3. High-impact terms: pricing, payment terms, termination clauses, liability caps, indemnification, exclusivity, IP ownership, non-compete, auto-renewal. These are where value is created or destroyed.
4. Deal-breakers: terms you cannot accept under any circumstances. These are non-negotiable. If the other party insists, you walk away.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
