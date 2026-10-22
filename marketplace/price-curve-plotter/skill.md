# Price Curve Plotter

Plot the four cumulative frequency curves and find the intersection points that define the acceptable price range.

## Inputs

- `survey-data`: The raw price perception data from respondents

## Outputs

- `price-curves`: The four cumulative frequency curves: too cheap (cumulative descending), cheap (cumulative descending), expensive (cumulative ascending), too expensive (cumulative ascending)
- `intersection-points`: The key intersections: Point of Marginal Cheapness (too cheap meets expensive), Optimal Price Point (too cheap meets too expensive), Indifference Price Point (cheap meets expensive), Point of Marginal Expensiveness (cheap meets too expensive)

## Process

1. For each of the four questions, create a cumulative frequency distribution: for 'too cheap' and 'cheap,' plot cumulative percentage descending (what % said this price or higher). For 'expensive' and 'too expensive,' plot cumulative percentage ascending (what % said this price or lower).
2. Find the intersections: the Optimal Price Point is where the 'too cheap' and 'too expensive' curves cross. The Indifference Price Point is where the 'cheap' and 'expensive' curves cross.
3. The acceptable price range is between the Point of Marginal Cheapness (too cheap meets expensive) and the Point of Marginal Expensiveness (cheap meets too expensive).
4. The optimal price is within this range, near the Indifference Price Point. Pricing below the range signals low quality. Pricing above the range loses customers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
