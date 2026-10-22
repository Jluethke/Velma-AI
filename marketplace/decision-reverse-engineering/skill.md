# Decision Reverse Engineering

Reverse-engineer the product decisions behind what you observed: why did they build it this way? What tradeoffs did they make?

## Inputs

- `usage-log`: 30 days of usage data
- `friction-inventory`: All friction points

## Outputs

- `product-decisions`: The inferred product decisions: what they prioritized (speed, features, simplicity, enterprise, SMB), what they deprioritized, and the tradeoffs they made
- `vulnerability-map`: Where the competitor is vulnerable: features they neglected, user segments they underserve, pain points they have not addressed

## Process

1. Group your observations by theme. If the product is fast but shallow, they prioritized speed over depth. If it has many features but poor UX, they prioritized feature breadth over usability.
2. Infer the target user: who is this product designed for? What use case is it optimized for? The answer reveals who they are NOT serving well.
3. Map the vulnerabilities: pain points they have not addressed, user segments they underserve, workflows they make awkward. These are your opportunities.
4. The goal is not to copy their strengths but to find their gaps. A teardown that produces 'they are good at everything' was not done rigorously.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
