# Marginal Return Estimator

Estimate the marginal return: what one additional dollar (or unit of resource) would produce in each category, given current spending levels.

## Inputs

- `allocation-snapshot`: The current spending and returns
- `average-returns`: The average return per dollar for reference

## Outputs

- `marginal-returns`: For each category: the estimated return from one additional dollar, with the reasoning and evidence
- `diminishing-return-flags`: Categories where marginal returns are significantly lower than average returns, indicating diminishing returns

## Process

1. For each category, estimate the marginal return by asking: if I increase spending by 10%, what incremental return do I expect? Divide the incremental return by the incremental spend.
2. Look for diminishing returns: categories where the marginal return is less than 50% of the average return. These are saturated. More spending produces less and less.
3. Look for increasing returns: categories where the marginal return exceeds the average. These are underfunded. More spending produces accelerating results (common in early-stage marketing or network-effect products).
4. Where historical data exists (last quarter you increased spend by X and got Y more return), use it. Where it does not, estimate based on the mechanism: is there a logical reason more spending would produce more return?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
