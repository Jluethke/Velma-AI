# Mitigation Plan Writer

Write a mitigation plan for each critical and high risk. A mitigation plan has three parts: prevent (reduce probability), prepare (reduce impact if it happens), and detect (know early).

## Inputs

- `owned-risk-list`: The risks with assigned owners
- `calibrated-probability-scale`: The probability scale for reference

## Outputs

- `mitigation-plans`: For each risk: the prevention actions, the preparation actions, and the detection mechanism, each with a deadline and cost estimate
- `residual-risk-assessment`: The expected probability and impact ratings after mitigation is in place

## Process

1. For each risk, write the prevention actions: what can you do to make the trigger event less likely? Be specific. 'Diversify revenue' is not a plan. 'Close 2 new clients above $50K ARR by Q3' is a plan.
2. Write the preparation actions: if the risk materializes despite prevention, what reduces the damage? This is insurance, reserves, backup systems, cross-trained staff, documented runbooks.
3. Write the detection mechanism: what signal tells you the risk is materializing before the full impact hits? Set the threshold and the response.
4. Estimate the cost of each action. If the mitigation costs more than the expected loss (probability times impact in dollars), the mitigation is not worth it. Accept the risk instead.
5. Re-rate the probability and impact assuming the mitigation is in place. The residual score is your new baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
