# Cart Abandonment Analyzer

Identify cart abandonment triggers and segment abandoners.

## Inputs

- `cart-data`: Historical cart and checkout data
- `abandonment-goals`: Target recovery rate and revenue goals

## Outputs

- `abandonment-segments`: Segments of cart abandoners by behavior
- `trigger-analysis`: Top reasons for cart abandonment

## Process

1. Calculate the overall cart abandonment rate.
2. Segment abandoners by stage (browse, add to cart, start checkout, payment).
3. Identify the top abandonment triggers (shipping cost, account creation, payment issues).
4. Prioritize segments by cart value and recovery likelihood.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
