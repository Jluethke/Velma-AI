# Ab Test Learnings Documenter

Analyze results, apply the winner, and document the learnings.

## Inputs

- `test-results`: Raw results per variant
- `statistical-analysis`: Significance calculations

## Outputs

- `test-winner`: The winning variant with performance delta and confidence level
- `testing-program-report`: Cumulative report of all tests, results, and learnings to date

## Process

1. Determine the winner based on the primary metric and statistical significance.
2. Apply the winning variant to future sends.
3. Document the learning (what was tested, what won, by how much, and the hypothesis for why).
4. Update the testing roadmap with the next test based on these learnings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
