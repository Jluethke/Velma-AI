# Interaction Pattern Analyzer

Analyze interaction logs to surface patterns you would not notice from individual entries: who you are over-investing in, who you are neglecting, and where your interaction quality is declining.

## Inputs

- `friction-reduction-plan`: The low-friction logging setup
- `accountability-system`: The compliance tracking system

## Outputs

- `interaction-heatmap`: A heatmap showing interaction frequency by contact over time, revealing clusters of attention and gaps
- `pattern-insights`: Identified patterns: contacts getting disproportionate attention relative to value, high-value contacts being neglected, interactions that are all outbound with no response

## Process

1. Build the interaction heatmap: contacts on one axis, weeks on the other, cell color by interaction count. Look for horizontal streaks (you talk to this person constantly) and vertical gaps (you went a month without logging anything, which means either a quiet period or a logging lapse).
2. Calculate the attention-value ratio: divide interaction count by relationship value for each contact. High ratio = over-invested (you are spending a lot of time on a low-value relationship). Low ratio = under-invested (high-value contact getting neglected). Sort by ratio to find the biggest mismatches.
3. Identify one-way relationships: contacts where your initiation ratio is above 0.8 (you initiate 80%+ of interactions). These are relationships where you are doing all the work. Some are worth maintaining (mentors, key clients). Others should be deprioritized or moved to a lighter cadence.
4. Run the analysis monthly. The patterns shift over time. A contact who was high-velocity last quarter may have gone quiet. A contact you were neglecting may have become strategically important. The analysis keeps your attention allocation aligned with reality.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
