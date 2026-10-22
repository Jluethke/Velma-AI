# Curve Plotting And Intersection

Plot the four cumulative distribution curves and find the key intersection points that define the optimal price range.

## Inputs

- `clean-responses`: Valid survey responses
- `response-count`: Number of responses

## Outputs

- `price-curves`: Four cumulative distribution curves plotted on the same chart
- `intersection-points`: The four key intersections: Point of Marginal Cheapness, Point of Marginal Expensiveness, Optimal Price Point, and Indifference Price Point

## Process

1. For each of the four questions, create a cumulative distribution: at each price point, what percentage of respondents gave that answer or lower?
2. Plot all four curves on one chart with price on the x-axis and cumulative percentage on the y-axis.
3. Find the intersections: the Optimal Price Point is where 'too cheap' and 'too expensive' cross. The Indifference Price Point is where 'bargain' and 'expensive' cross. The range between Marginal Cheapness and Marginal Expensiveness is the acceptable price range.
4. The Optimal Price Point is not necessarily the price you should charge. It is the price at which resistance from both directions is minimized.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
