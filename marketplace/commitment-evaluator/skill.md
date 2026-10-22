# Commitment Evaluator

Evaluate reserved instances, savings plans, and committed use discounts for predictable workloads.

## Inputs

- `billing-data`: Current spending data
- `rightsizing-recommendations`: Post-rightsizing resource needs

## Outputs

- `commitment-recommendations`: Recommended reservations or savings plans
- `commitment-savings`: Estimated savings from commitments

## Process

1. Identify workloads with stable, predictable usage
2. Compare on-demand vs reserved vs savings plan pricing
3. Recommend the commitment type and term for each workload
4. Calculate the total savings from recommended commitments

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
