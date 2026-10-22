# Review Source Collection

Gather fifty to one hundred competitor reviews skewed toward the 1-star and 3-star range, where the real complaints live.

## Inputs

- `competitor-list`: The competitors whose buyers overlap with yours
- `review-sources`: Where their reviews live, such as app stores, review sites, and forums

## Outputs

- `raw-reviews`: Collected reviews with star rating, date, and source
- `source-coverage`: How many reviews came from each competitor and source, to expose gaps

## Process

1. For each competitor, collect reviews across the named sources, aiming for fifty to one hundred in total.
2. Weight collection toward 1-star and 3-star reviews, since 5-star reviews rarely name a real problem.
3. Keep the star rating, date, and source with each review so later ranking can account for recency.
4. Record how many reviews came from each competitor and source so you can see where coverage is thin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
