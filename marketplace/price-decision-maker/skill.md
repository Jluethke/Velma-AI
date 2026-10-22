# Price Decision Maker

Use the Van Westendorp results to make the pricing decision. Combine with cost data and competitive positioning.

## Inputs

- `intersection-points`: The price range and optimal point from the analysis
- `product-description`: The product context, costs, and competitive landscape

## Outputs

- `pricing-recommendation`: The recommended price with the range it falls within and the reasoning: Van Westendorp range, cost floor, competitive position
- `price-test-plan`: If uncertain: a plan to A/B test 2-3 prices within the acceptable range to find the revenue-maximizing point

## Process

1. Set the floor: the price must cover costs plus the target margin. If the Van Westendorp range is entirely below the cost floor, the product cannot be sold profitably at market-acceptable prices.
2. Set the ceiling: the Point of Marginal Expensiveness. Above this, customer acquisition drops sharply.
3. Position within the range: near the top for premium positioning, near the middle for market rate, near the bottom for volume or penetration.
4. If the range is wide, consider testing 2-3 prices: the Van Westendorp optimal point, a price 10% above, and a price 10% below. Measure which produces the highest revenue (price times quantity).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
