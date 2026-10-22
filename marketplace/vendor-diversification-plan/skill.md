# Vendor Diversification Plan

Design the diversification plan for each concentrated function.

## Inputs

- `concentration-risk-scores`: The ranked list of concentration risks
- `switching-analysis`: The switching cost and time estimates

## Outputs

- `diversification-plan`: For each concentrated function: the mitigation strategy (qualify a second vendor, build in-house, stockpile, renegotiate), the timeline, and the budget
- `acceptable-concentrations`: Functions where the concentration risk is accepted because the switching cost exceeds the expected loss, with the reasoning documented

## Process

1. For each concentration risk, select the mitigation strategy: qualify a second vendor (split the spend 70/30), build in-house capability for the critical component, stockpile enough inventory to survive a vendor failure, or renegotiate the contract with exit provisions and data portability.
2. Estimate the cost of each mitigation. Compare to the expected loss from a vendor failure (probability of failure times impact). If the mitigation costs less, proceed. If not, accept the risk with documented reasoning.
3. Set the timeline: second-vendor qualification is typically 3-6 months. In-house build depends on complexity. Stockpiling can begin immediately.
4. For accepted concentrations, set a monitoring plan: track the vendor's financial health, service quality, and any signals of instability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
