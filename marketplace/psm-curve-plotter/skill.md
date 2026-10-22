# Psm Curve Plotter

Build the four cumulative distribution curves and find the intersection points that define the price range and optimal price.

## Inputs

- `clean-responses`: The validated response data

## Outputs

- `psm-curves`: Four cumulative frequency curves: too cheap (cumulative from high to low), bargain (cumulative from high to low), expensive (cumulative from low to high), too expensive (cumulative from low to high)
- `intersection-points`: The four key price points: point of marginal cheapness (too cheap crosses bargain), optimal price point (too cheap crosses too expensive), indifference price point (bargain crosses expensive), point of marginal expensiveness (expensive crosses too expensive)

## Process

1. Build each cumulative distribution: for 'too cheap' and 'bargain', calculate the percentage of respondents who gave a price AT OR ABOVE each price point (cumulative from high to low). For 'expensive' and 'too expensive', calculate the percentage who gave a price AT OR BELOW each price point (cumulative from low to high).
2. Plot all four curves on the same price axis (x-axis is price, y-axis is cumulative percentage). The curves will intersect at four points.
3. Find the intersections: (1) Point of Marginal Cheapness (PMC): where 'too cheap' crosses 'expensive'. Below this price, more people think it's too cheap than think it's expensive. (2) Optimal Price Point (OPP): where 'too cheap' crosses 'too expensive'. This minimizes the combined resistance from both ends. (3) Indifference Price Point (IDP): where 'bargain' crosses 'expensive'. At this price, equal numbers consider it a bargain and consider it expensive. (4) Point of Marginal Expensiveness (PME): where 'bargain' crosses 'too expensive'.
4. The acceptable price range is between PMC and PME. The OPP is the price that minimizes total price resistance. The IDP is the expected market price (what people are used to paying).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
