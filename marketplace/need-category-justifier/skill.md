# Need Category Justifier

For each spending category, answer from scratch: if you were starting today with zero allocated here, would you allocate money, and how much?

## Inputs

- `allocatable-income`: The total available to allocate
- `spending-categories`: The list of all current spending categories (do not pre-fill amounts)

## Outputs

- `justified-allocations`: Each category with its justified amount, the specific reason for the amount, and the minimum viable amount (the lowest you could spend and still function)
- `allocation-total`: Sum of all justified allocations, which must equal allocatable income (every dollar assigned)

## Process

1. Take each category with a zero balance. Ask: what specific outcome does spending in this category produce? If the answer is vague ('it's nice to have'), the justified amount is zero until a specific outcome is defined.
2. For each category with a defined outcome, determine the minimum viable amount: the least you could spend and still achieve the outcome. Then determine the sufficient amount: the point beyond which additional spending produces diminishing returns.
3. Set the justified allocation between the minimum viable and sufficient amounts. The specific number should be defensible: 'I need $X because [specific items at specific prices]', not 'I usually spend about $X.'
4. After all categories are justified, total them. If the total exceeds allocatable income, force-rank the categories by importance and cut from the bottom until the total fits. If the total is below allocatable income, the remainder goes to savings or debt paydown.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
