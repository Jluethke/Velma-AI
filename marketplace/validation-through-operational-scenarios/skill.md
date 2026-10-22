# Validation Through Operational Scenarios

Validate the system by operating it in representative scenarios to confirm it meets the stakeholder needs, distinct from verification which confirms it meets the written requirements.

## Inputs

- `test-results`: Completed verification results
- `anomaly-reports`: Resolved anomaly records

## Outputs

- `validation-results`: For each operational scenario: whether the system met the stakeholder's actual need (not just the written requirement), user feedback, and any gaps between what was specified and what was needed
- `requirements-gaps`: Requirements that were met (verified) but did not actually satisfy the need, and needs that have no corresponding requirement
- `acceptance-recommendation`: Recommendation to accept the system, accept with conditions, or reject, based on the combined verification and validation evidence

## Process

1. Distinguish validation from verification. Verification asks: 'Did we build the product right?' (does it meet the specification). Validation asks: 'Did we build the right product?' (does it meet the need). A product can pass every verification test and still fail validation if the requirements did not capture the real need.
2. Execute operational scenarios from the concept of operations. Use real or representative users in realistic environments. Observe how they interact with the system, not just whether the system performs to specification. Note workarounds, confusions, and unintended use patterns. These are validation findings even if no requirement is technically violated.
3. Identify requirements gaps: needs that were not captured in requirements (and therefore not verified) but are clearly important when the system is used in context. Also identify over-specified requirements: cases where the written requirement was stricter than necessary and drove unnecessary cost or complexity.
4. Compile the acceptance recommendation. Acceptance does not require zero deficiencies. It requires that all safety and mission-critical requirements are verified, all significant operational scenarios are validated, and any open deficiencies have an acceptable mitigation plan. Document the residual risks accepted by the decision authority.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
