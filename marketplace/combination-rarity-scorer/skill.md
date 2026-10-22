# Combination Rarity Scorer

Score every possible 3-skill combination from your top-quartile skills by how rare that combination is in the population.

## Inputs

- `top-quartile-skills`: Skills where you are at or above the 75th percentile
- `skill-inventory`: Complete skill list with percentiles

## Outputs

- `combination-scores`: Every 3-skill combination ranked by rarity (fewer people hold all three at 75th+)
- `market-value-notes`: For the top 5 combinations, notes on where that combination is valuable

## Process

1. Generate every possible 3-skill combination from your top-quartile list.
2. For each combination, estimate how many people hold all three at the 75th percentile or above. The fewer people, the higher the rarity score.
3. Consider adjacency: skills from the same domain (two programming languages) are less rare together than skills from different domains (programming + sales + writing).
4. For the top 5 rarest combinations, identify specific roles, industries, or situations where that exact combination is disproportionately valuable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
