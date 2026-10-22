# Actual Vs Justified Gap Finder

Compare the zero-based justified allocations against actual spending to find the bloat: categories where actual spending exceeds what a fresh-start analysis would justify.

## Inputs

- `justified-allocations`: The zero-based allocations for each category
- `actual-spending`: Actual spending by category for the last 3 months

## Outputs

- `bloat-table`: Each category showing justified amount, actual average, the gap (actual minus justified), and the gap as a percentage of justified
- `total-bloat`: Sum of all positive gaps: total monthly overspend relative to what a zero-based analysis justifies

## Process

1. Calculate the 3-month average actual spending for each category. Compare it against the justified allocation.
2. Calculate the gap: actual minus justified. A positive gap means bloat (spending more than justified). A negative gap means underspending (either discipline or a category that needs more allocation).
3. Calculate the gap percentage: gap divided by justified amount. A 10% gap is normal variance. A 50% gap is structural bloat. A 200% gap means the category has fundamentally drifted from its purpose.
4. Sort by absolute gap descending. The top 3 categories by gap amount represent the majority of the bloat. These are the only categories worth intervening on (the rest is noise).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
