# Trade Study Sensitivity And Documentation

Test the robustness of the recommendation by varying weights and scores, then document the decision for traceability.

## Inputs

- `weighted-rankings`: Candidate rankings
- `score-matrix`: All scores with rationale
- `criteria-weights`: Weights used

## Outputs

- `sensitivity-results`: Tornado chart showing how much each criterion weight must change to reverse the recommendation. Monte Carlo results showing the probability that the recommended alternative remains best under weight and score uncertainty.
- `trade-study-report`: Complete documentation: problem statement, alternatives considered, criteria and weights with rationale, scores with evidence, sensitivity analysis, recommendation with rationale, and dissenting opinions
- `decision-record`: One-page summary: what was decided, why, what alternatives were rejected, and under what conditions the decision should be revisited

## Process

1. Run one-at-a-time sensitivity: for each criterion, vary the weight from 0 to its maximum and plot how the ranking changes. Identify the crossover point where the runner-up overtakes the winner. If the crossover requires only a small weight change (e.g., less than 10% of the total weight), the decision is sensitive to that criterion and merits extra scrutiny.
2. Run Monte Carlo sensitivity: assign distributions to weights (e.g., +/- 20% of nominal) and scores (e.g., +/- 1 point). Run 10,000 trials. Report the percentage of trials where each candidate wins. If the recommended alternative wins in more than 70% of trials, the decision is solid. Below 50%, the result is too close to call and additional data is needed.
3. Document the complete trade study. Future engineers will revisit this decision when requirements change. They need to understand not just what was decided but why, what alternatives were considered, and what would have to change for a different alternative to be preferred. Include dissenting opinions: if an evaluator disagreed with the recommendation, document their reasoning.
4. Write the decision record as a one-page summary for management and downstream teams who need to know the outcome without reading the full study. State the decision, the two strongest reasons supporting it, the main risk of the decision, and the trigger conditions that should cause the team to revisit it (e.g., if the cost of component X increases by more than 30%).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
