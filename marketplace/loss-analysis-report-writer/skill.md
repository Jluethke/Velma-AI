# Loss Analysis Report Writer

Produce the loss analysis report: the patterns, the counterfactual actions, and the measurement plan to track whether the changes work.

## Inputs

- `validated-patterns`: Confirmed loss patterns
- `counterfactual-actions`: Specific changes to implement
- `implementation-priority`: Actions ranked by expected impact

## Outputs

- `loss-analysis-report`: The full report: patterns, evidence, actions, priorities, and a 90-day measurement plan
- `tracking-metrics`: The specific metrics to watch (loss rate by stage, objection frequency, win rate change) and the baseline values

## Process

1. Write the report in four sections: what we found (patterns), why it matters (value at stake), what to do (actions in priority order), and how to measure (metrics and timeline).
2. For each action, name the owner, the deadline, and the metric that moves if it works.
3. Set the measurement cadence: re-run this analysis quarterly. Compare the new loss patterns against the old ones. If the patterns shifted, the actions worked. If they persisted, the actions missed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
