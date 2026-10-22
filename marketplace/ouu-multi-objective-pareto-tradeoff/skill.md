# Ouu Multi Objective Pareto Tradeoff

When performance and risk pull in different directions, compute the trade-off front of non-dominated designs so the decision maker sees the exchange rate between objectives rather than one arbitrary weighting.

## Inputs

- `deterministic-reformulation`: The solvable constraints the search must honor
- `risk-preference`: The competing objectives, for example expected performance versus variability

## Outputs

- `pareto-front`: The set of non-dominated designs trading the competing objectives, with a front-quality measure
- `tradeoff-insight`: The exchange rate between objectives and the knee region where improvement in one costs the most in the other

## Process

1. Define Pareto dominance. A design dominates another if it is at least as good in every objective and strictly better in at least one; the Pareto front is the set of non-dominated designs, and every point on it is a legitimate optimum for some preference. Reporting the front, not a single point, keeps the risk trade-off explicit.
2. Generate the front by the epsilon-constraint method for a few objectives. Minimize the primary objective f1 subject to the others held below moving bounds, f2 <= epsilon, and sweep epsilon across its range; each solve yields one Pareto point, and the sweep traces the front without the blind spots a weighted sum has on non-convex fronts.
3. Use a weighted-sum scalarization only when the front is known to be convex. Minimizing w1*f1 + w2*f2 over a grid of weights is simple but cannot reach points on a concave part of the front no matter the weights, so it can miss attractive trade-off designs; prefer epsilon-constraint or an evolutionary method when convexity is not assured.
4. Use a multi-objective evolutionary method for many objectives or black-box models. A non-dominated sorting genetic algorithm (NSGA-II) evolves a population toward the front and spreads it with a crowding measure, handling non-convex, disconnected, and noisy fronts that gradient methods struggle with, at the cost of many model evaluations (pair it with a surrogate when the model is expensive).
5. Measure front quality and find the knee. Use the hypervolume indicator (the volume of objective space dominated by the front relative to a reference point) to compare fronts and to check convergence; locate the knee, where the exchange rate turns sharply, because designs near the knee usually give the best balance and are the natural candidates to present to the decision maker.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
