# Trade Study Scoring And Ranking

Score each candidate against the criteria using independent evaluators, compute weighted scores, and identify the recommended alternative.

## Inputs

- `evaluation-criteria`: Defined criteria with precise definitions
- `criteria-weights`: Normalized weights
- `scoring-scales`: Anchored scales for each criterion
- `candidate-list`: Candidates to evaluate

## Outputs

- `score-matrix`: Each candidate scored on each criterion by each evaluator, with the scoring rationale documented
- `weighted-rankings`: Weighted sum for each candidate, ranked from highest to lowest, with the score breakdown showing which criteria drove the ranking
- `consensus-scores`: Where evaluators disagreed by more than 2 points, the resolution discussion and agreed score

## Process

1. Have each evaluator score candidates independently before any group discussion. This prevents anchoring to the first opinion voiced. Each evaluator sees the same candidate data package and uses the same anchored scales. Record individual scores.
2. Score criteria first, then candidates. Score all candidates on criterion 1 before moving to criterion 2. This prevents the halo effect where a generally preferred candidate gets inflated scores on every criterion. The order criterion-then-candidate is the single most effective bias mitigation.
3. Compute the weighted score for each candidate: sum of (weight_i * score_i) across all criteria. Rank candidates by weighted score. Examine the score breakdown: a candidate that wins overall but scores poorly on a high-weight criterion may not be the right choice if that criterion represents a safety or regulatory requirement.
4. Resolve scoring disagreements. Where evaluators differ by more than 2 points on the same criterion, discuss the evidence each used. The goal is not to average the scores but to identify whether the disagreement reflects different information (one evaluator has data the other does not) or different judgment (legitimate difference in interpretation). Document the resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
