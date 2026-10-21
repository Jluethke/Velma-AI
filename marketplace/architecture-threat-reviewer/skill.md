# Architecture Threat Reviewer

Review the completed architecture against known threats and attack patterns to validate the design.

## Inputs

- `network-architecture`: Network design to review
- `control-matrix`: Controls in place
- `residual-risk-register`: Accepted risks

## Outputs

- `threat-review-findings`: Weaknesses identified during threat review with recommended fixes
- `security-architecture-document`: Final security architecture document incorporating review feedback

## Process

1. Walk through common attack scenarios (external breach, insider threat, supply chain compromise) against the design
2. Check for single points of failure in security controls
3. Verify defense in depth: no single control failure exposes sensitive data
4. Produce the final architecture document with review findings incorporated

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
