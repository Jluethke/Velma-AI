# Third Order And Tail Risk Scanner

Extend the consequence tree one more level. Third-order consequences are speculative but occasionally catastrophic. The goal is not to predict them precisely but to flag the ones with asymmetric downside: low probability but very high impact if they occur.

## Inputs

- `second-order-map`: The second-order consequences
- `reversal-alerts`: Known reversals from second-order analysis

## Outputs

- `third-order-flags`: Third-order consequences worth monitoring, especially those with asymmetric downside
- `tail-risk-list`: Low-probability, high-impact consequences that could emerge downstream

## Process

1. For each significant second-order effect, ask one more time: 'And then what?'
2. Focus on effects with asymmetric downside: unlikely but devastating if they occur.
3. Do not try to predict third-order effects precisely. The value is in identifying the category of risk, not the exact scenario.
4. Check for third-order effects that interact with each other (compounding tail risks).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
