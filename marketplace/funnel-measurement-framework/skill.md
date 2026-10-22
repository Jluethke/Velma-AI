# Funnel Measurement Framework

Measure the funnel at every micro-commitment point. The data tells you which steps are working and which are still too big a jump.

## Inputs

- `revised-journey`: The complete funnel with micro-commitments
- `natural-lock-in-points`: Where accumulated value is highest

## Outputs

- `measurement-framework`: Metrics for each step: completion rate, time between steps, and the ratio of people who reach the next step vs those who stall
- `optimization-priorities`: The steps with the lowest completion rates, ranked by impact on overall conversion

## Process

1. At each micro-commitment, track: how many people reach it, how many complete it, how long it takes them, and how many proceed to the next step.
2. Calculate the step-over-step conversion rate. If step 3 has a 90% completion rate but step 4 has a 40% completion rate, step 4 is still too big a jump.
3. For each low-conversion step, diagnose: is the ask too large? Is the value unclear? Is the timing wrong? Does the person have enough accumulated value to justify the ask?
4. Prioritize optimization by impact: improving a step where 50% of all remaining prospects drop off is more valuable than improving a step where 5% drop off.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
