# Hypothesis And Prior Setter

State the hypothesis and assign a prior probability. The prior is your honest best estimate before any new evidence. It can come from base rates (what percentage of startups succeed? what percentage of candidates in this pipeline are good hires?) or from your experience. The critical rule: write the prior down before looking at the evidence.

## Inputs

- `hypothesis`: The belief or claim to evaluate (stated as a yes/no proposition)
- `base-rate-information`: Any known base rates relevant to this hypothesis (industry averages, historical data, etc.)

## Outputs

- `stated-prior`: The prior probability (0 to 1) with the reasoning for that number
- `base-rate-anchor`: The base rate used as the starting point, if available

## Process

1. State the hypothesis as a yes/no proposition. Not 'how good is this candidate?' but 'will this candidate be in the top 25% of performers after 12 months?'
2. Look for a base rate. What percentage of similar situations had this outcome historically?
3. If no base rate exists, estimate from your experience. Be honest about uncertainty.
4. Write the prior down. This is the number you will update against. Once written, do not change it retroactively.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
