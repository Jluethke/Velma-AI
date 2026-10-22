# Decision Categorization

Sort each logged decision into essential, automatable, or eliminable. Essential decisions need real judgment; automatable ones follow a clear rule; eliminable ones should not have reached you at all.

## Inputs

- `decision-log`: Every decision from the day
- `decision-count`: Total decisions logged

## Outputs

- `categorized-decisions`: Each decision tagged essential, automatable, or eliminable
- `category-counts`: How many decisions fell into each category

## Process

1. Tag a decision essential when it needs genuine judgment and the outcome matters.
2. Tag a decision automatable when a clear rule would reach the same answer you would.
3. Tag a decision eliminable when it adds no value and only exists out of habit or poor setup.
4. Count each category so the split between judgment and noise is visible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
