# Fta Quantitative Analysis

Calculate the top event probability from basic event failure rates and use importance measures to identify which basic events contribute most to system risk.

## Inputs

- `minimal-cut-sets`: All minimal cut sets
- `basic-event-list`: Basic events with failure rate estimates

## Outputs

- `top-event-probability`: Calculated probability of the top event per mission time or per demand, with uncertainty bounds
- `importance-rankings`: Basic events ranked by Fussell-Vesely importance (contribution to top event probability), Birnbaum importance (sensitivity of top event to this event), and Risk Achievement Worth (how much top event increases if this event is certain to fail)
- `dominant-cut-sets`: The cut sets contributing 90% or more of the top event probability

## Process

1. Assign failure probabilities to each basic event. For hardware: convert failure rate (lambda) to probability using P = 1 - exp(-lambda * t) where t is mission time. For repairable systems with periodic testing: P = 1 - exp(-lambda * tau/2) where tau is the test interval. For human errors, use HRA techniques or published error probability data.
2. Calculate cut set probabilities. For an AND cut set: P(cut set) = product of constituent event probabilities. For rare events (P < 0.1), this product approximation is accurate. For higher probabilities, use the exact calculation: P(A AND B) = P(A) * P(B|A).
3. Calculate top event probability using the inclusion-exclusion formula or the rare event approximation. Rare event: P(top) = sum of all cut set probabilities. For better accuracy, subtract the pairwise intersections of cut sets (second-order inclusion-exclusion). Verify that the rare event approximation error is below 10% by checking if the sum exceeds 0.1.
4. Calculate importance measures. Fussell-Vesely: FV(i) = sum of probabilities of all cut sets containing event i, divided by top event probability. This tells you what fraction of risk is removed if event i is guaranteed not to occur. Birnbaum: BI(i) = P(top | event i certain) - P(top | event i impossible). This measures sensitivity. Risk Achievement Worth: RAW(i) = P(top | event i certain) / P(top baseline).
5. Identify dominant cut sets: sort by probability and find the set contributing 90% of the top event probability. In most real systems, 5 to 10 cut sets dominate. These are where design improvement investment has the highest return.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
