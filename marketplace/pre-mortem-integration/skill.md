# Pre Mortem Integration

Integrate the pre-mortem findings into the actual plan. Embed each mitigation as a named task in the project timeline. Set tripwire indicators that would signal a failure mode is materializing. Schedule a mid-point check to compare reality against the failure stories.

## Inputs

- `revised-mitigation-plan`: The stress-tested mitigations
- `residual-risks`: Failure modes that could not be fully mitigated

## Outputs

- `pre-mortem-report`: The complete pre-mortem report: failure themes, mitigations, residual risks, tripwire indicators, and mid-point check date
- `tripwire-indicators`: Early warning signals that a failure mode is beginning to materialize

## Process

1. Convert each mitigation into a task with a deadline and owner, embedded in the project plan.
2. For each residual risk, define a tripwire indicator: an observable event that would signal the risk is materializing.
3. Schedule a mid-point review to compare actual progress against the failure stories. Are any failure themes starting to play out?
4. Archive the failure stories. They become the benchmark for the mid-point review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
