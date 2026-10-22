# Ouu Stochastic Formulation Selection

Choose how uncertainty enters the objective and constraints, trading expected performance against variability and against protection from distributional error.

## Inputs

- `uncertainty-model`: The input distributions and intervals
- `uncertainty-type-split`: The aleatory and epistemic classification that steers the formulation

## Outputs

- `stochastic-formulation`: The objective and constraint form (expected value, mean-variance, chance-constrained, worst-case over an ambiguity set)
- `risk-preference`: The stated risk attitude and the parameters that encode it (variance weight, confidence level, ambiguity radius)

## Process

1. Use an expected-value objective when many independent realizations average out. Minimize E[f(x, xi)] over design x and random xi when the design will see the long-run average, for example a cost averaged over many production units; this is the simplest formulation and the baseline the others improve on.
2. Use a mean-variance objective when variability itself is a cost. Minimize E[f] + k*sqrt(Var[f]) or E[f] + k*Var[f], where the weight k encodes risk aversion; a larger k pushes the design toward lower scatter at the expense of average performance, tracing a performance-versus-consistency trade.
3. Use chance constraints when a limit must hold with high probability. Replace a hard constraint g(x, xi) <= 0 with P(g(x, xi) <= 0) >= 1 - alpha, where alpha is the allowed violation probability (for example alpha = 0.01 for 99 percent reliability); this admits rare excursions in exchange for a less conservative, feasible design.
4. Use a worst-case formulation over an ambiguity set when the distribution itself is uncertain. Minimize the worst-case expectation max over P in an ambiguity set of E_P[f], where the set is defined by moment bounds or a distance (for example a Wasserstein ball of radius epsilon around the empirical distribution). This protects against getting the distribution wrong, at the cost of conservatism that grows with the ambiguity radius.
5. Match the formulation to the risk preference and justify it. State whether the owner of the design cares about average cost, consistency, a reliability target, or protection from modeling error, and choose the formulation that encodes that preference; a mismatch produces a mathematically optimal design that solves the wrong problem.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
