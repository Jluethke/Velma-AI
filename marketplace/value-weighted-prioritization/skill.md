# Value Weighted Prioritization

Weight each theme by the value of the customers who raised it: feedback from high-value customers gets higher priority.

## Inputs

- `theme-frequencies`: Themes with counts
- `feedback-corpus`: Feedback with customer tier

## Outputs

- `weighted-themes`: Each theme with a value-weighted score: frequency x average customer value of the reporters
- `priority-themes`: The top 3 themes by value-weighted score, which represent the highest-priority product work

## Process

1. For each theme, calculate the average customer value (revenue or tier) of the customers who raised it. A theme raised by 5 enterprise customers (high value) may be more important than a theme raised by 50 free users (low value).
2. Calculate the weighted score: theme frequency x average customer value. This gives enterprise feedback higher weight without ignoring volume.
3. If a theme is raised by both high-value and low-value customers, it is doubly important: it affects both retention and growth.
4. The top 3 weighted themes are the product team's priority. Addressing these has the highest expected impact on both retention and revenue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
