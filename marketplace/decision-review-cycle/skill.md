# Decision Review Cycle

Review decisions on their recorded review dates. Compare the expected outcome to the actual outcome. If the decision was wrong, record why and decide whether to reverse it. If it was right, record the evidence.

## Inputs

- `retroactive-decision-records`: Past decisions now logged
- `relitigation-reduction-baseline`: Baseline relitigation rate

## Outputs

- `decision-review-process`: Process for reviewing decisions: compare expected vs actual outcome, record verdict, decide on action
- `decision-log-system-doc`: Complete decision log system documentation: template, triggers, capture workflow, review cycle, and relitigation metrics

## Process

1. On the review date, compare the expected outcome to the actual outcome. Three possible verdicts: confirmed (the decision produced the expected result), partially confirmed (some of the expected result, but not all), or reversed (the decision did not produce the expected result and should be reconsidered).
2. For reversed decisions: record why the decision was wrong. Was the reasoning flawed, or did circumstances change? If circumstances changed, the original decision may have been right at the time. If the reasoning was flawed, document what was missed so future decisions avoid the same error.
3. For confirmed decisions: record the evidence that it worked. This creates a library of decision patterns that can inform future decisions in similar situations.
4. Measure the improvement: compare the relitigation rate after 3 months to the baseline. A well-functioning decision log reduces relitigation by 50 percent or more, because people can look up the reasoning instead of asking or arguing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
