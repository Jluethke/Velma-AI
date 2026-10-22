# Score Decay And Momentum Tracker

Track score changes over time to identify relationship momentum (accelerating or decaying) as a leading indicator of relationship health.

## Inputs

- `scored-contact-list`: Contacts with composite scores
- `score-driven-actions`: Actions from score patterns

## Outputs

- `momentum-classifications`: Each contact classified as accelerating, stable, decaying, or stalled, based on score trajectory over the last 3 months
- `early-warning-list`: Contacts where momentum just turned negative (the relationship was growing but stopped), which is the highest-leverage moment for intervention

## Process

1. Calculate momentum as the slope of the composite score over the last 3 monthly snapshots. Positive slope = accelerating. Near-zero slope = stable. Negative slope = decaying. No score history = new (treat as accelerating for the first 3 months to give the relationship a chance).
2. Build the early-warning system. The most important signal is not a low score (that contact may have always been peripheral) but a newly negative slope (that contact was important and is becoming less so). Flag any contact that moved from accelerating or stable to decaying in the last month.
3. Cross-reference momentum with strategic importance. A decaying relationship with low strategic importance is natural attrition. A decaying relationship with high strategic importance is a problem. Prioritize intervention for the latter.
4. Produce the monthly momentum report: total contacts accelerating vs. decaying (the ratio tells you if your network is growing or shrinking in quality), the top 5 fastest-rising contacts (your emerging priorities), and the top 5 fastest-declining (your urgent interventions).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
