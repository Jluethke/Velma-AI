# Tolerance Allocation Method

Allocate tolerances to individual dimensions to meet the assembly requirement at minimum manufacturing cost, using sensitivity analysis to put tight tolerances where they matter most.

## Inputs

- `rss-results`: RSS statistical stackup results
- `monte-carlo-results`: Monte Carlo distribution results

## Outputs

- `allocated-tolerances`: Revised tolerance for each dimension in the chain, with the manufacturing process required to hold each tolerance and estimated cost impact
- `tolerance-specification`: Updated drawing callouts for each part, ready for release to manufacturing

## Process

1. Start with equal allocation: divide the total allowable tolerance equally among all contributors using RSS. Each dimension gets tolerance_i = (T_total / n) * sqrt(n) = T_total / sqrt(n) where n is the number of dimensions and T_total is the assembly tolerance requirement.
2. Adjust for manufacturing capability. Each tolerance has a natural achievable level depending on the process: general machining holds +/-0.1mm, precision machining +/-0.025mm, grinding +/-0.005mm, injection molding +/-0.1mm for the first 25mm. Tighter than the natural process capability requires secondary operations and cost escalation.
3. Use proportional scaling: allocate tighter tolerances to dimensions with higher sensitivity (larger influence on the functional dimension) and looser tolerances to dimensions with lower sensitivity. If dimension A has twice the sensitivity of dimension B, dimension A gets a tolerance sqrt(2) times tighter.
4. Apply cost weighting. Estimate the cost multiplier for each tolerance level: 1x at general machining, 2x at precision, 5x at grinding, 10x at lapping. Minimize total cost: the optimal allocation gives tighter tolerances to dimensions that are cheap to hold tight and looser tolerances to dimensions that are expensive to control.
5. Verify the allocation by running the Monte Carlo with the new tolerances. Confirm the defect rate meets the target. Document the allocated tolerances on the part drawings with GD&T callouts that reference the functional datums used in the stackup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
