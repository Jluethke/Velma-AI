# Claim Extractor

Extract the factual claims supported by the data: each claim is a statement with its supporting evidence, effect size, and confidence level.

## Inputs

- `experimental-results`: Tables, figures, and statistical outputs from the experiment
- `research-question`: The original question the experiment addressed

## Outputs

- `claim-list`: Each claim with its evidence, effect size, p-value or CI, and strength label
- `unsupported-observations`: Observations in the data that do not yet map to a testable claim

## Process

1. Scan each figure and table for results that answer the research question.
2. For each result, write the claim as a declarative sentence.
3. Attach the supporting statistic: effect size, confidence interval, and p-value.
4. Rate the claim strength: definitive (p < 0.001 and large effect), moderate, or suggestive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
