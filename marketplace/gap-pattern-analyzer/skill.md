# Gap Pattern Analyzer

Find the patterns across hundreds of complaints. The recurring gaps are the market opportunities. The rare complaints are noise.

## Inputs

- `structured-reviews`: Reviews broken into expectation, reality, and gap description
- `raw-language-bank`: Exact phrases grouped by theme

## Outputs

- `gap-pattern-report`: The 5-10 most common gaps ranked by frequency, with representative quotes and the number of reviews mentioning each
- `unmet-needs-list`: Needs that customers express but no competitor in the market currently satisfies

## Process

1. Count the frequency of each theme. The top themes are the biggest market gaps.
2. Within each theme, identify the specific unmet need. 'Bad support' is a theme. 'Cannot get a human within 24 hours for billing issues' is the unmet need.
3. Separate gaps into two categories: gaps you can fill (product/service opportunities) and gaps you cannot fill (structural limitations of the category). Focus on the first.
4. Rank by frequency times severity. A gap mentioned by 40% of reviewers at 1 star is more valuable than a gap mentioned by 10% at 3 stars.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
