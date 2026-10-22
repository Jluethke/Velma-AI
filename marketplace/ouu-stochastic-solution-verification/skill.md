# Ouu Stochastic Solution Verification

Verify the chosen optimum with an independent reliability and sensitivity check, because an optimum found on an approximated stochastic problem can be fragile to the approximations that produced it.

## Inputs

- `pareto-front`: The candidate optimal designs to be verified
- `uncertainty-model`: The distributions used for independent reliability estimation

## Outputs

- `verified-reliability`: The true constraint-satisfaction probability of the selected design from an independent estimate
- `solution-sensitivity`: How the optimum shifts under perturbations to the distributions and the ambiguity radius

## Process

1. Re-estimate the reliability of the selected design with an independent method. If the constraints were reformed analytically or by a reliability index, confirm the achieved probability with a Monte Carlo or subset-simulation run; a design sized for 99 percent reliability that verifies at 95 percent means the reformulation assumptions did not hold.
2. Test sensitivity to the distribution parameters. Perturb the means, standard deviations, and correlations within their epistemic ranges and re-solve or re-evaluate; an optimum that moves a lot or loses feasibility under small distribution changes is fragile and should be reported as such, possibly pushing toward the worst-case formulation.
3. Check the active chance constraints. Identify which probabilistic constraints are binding at the optimum; those are where the design is most exposed, and small errors in their distributions or in the reformulation have the largest effect on realized reliability.
4. Vary the ambiguity radius for worst-case formulations. Trace how the optimal objective and design change as the Wasserstein or moment-set radius grows; the rate of degradation shows the price of distributional protection and whether the chosen radius is defensible given the data behind the distribution.
5. Report the verified design with its reliability, its binding constraints, and its sensitivity. Present the optimum as a design that achieves a stated probability of meeting each constraint, with the evidence from the independent check and the conditions under which that claim could break, so the decision rests on verification rather than on the optimizer having stopped.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
