# Contract Risk Scanner

Scan for hidden risks: terms that seem standard but create outsized exposure. The worst contract terms are the ones that look boring.

## Inputs

- `contract-terms`: The full contract including negotiated terms
- `term-classification`: The term classifications

## Outputs

- `hidden-risk-list`: Terms that create disproportionate risk: unlimited liability, broad indemnification, unilateral amendment, automatic renewal with price increase, assignment without consent
- `risk-mitigation-requests`: Specific changes to mitigate each hidden risk, with the rationale

## Process

1. Scan for unlimited liability: is there a cap? If not, request one. Standard cap: 12 months of fees or the contract value.
2. Scan for broad indemnification: are you indemnifying them for their own negligence? Limit indemnification to your acts and omissions.
3. Scan for unilateral rights: can they change terms, raise prices, or assign the contract without your consent? Require mutual consent for changes.
4. Scan for termination traps: what happens on termination? Is there a penalty? Do you retain your data and IP? Is there a transition period?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
