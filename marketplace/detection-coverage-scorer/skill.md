# Detection Coverage Scorer

Measure detection coverage by comparing red team executions against blue team observations.

## Inputs

- `execution-log`: Red team execution log
- `blue-team-observations`: Blue team observation notes

## Outputs

- `detection-scorecard`: Matrix of techniques tested vs detection status (detected, partial, missed)
- `coverage-percentage`: Overall detection coverage percentage

## Process

1. Align each executed technique with corresponding blue team observations
2. Score each technique as detected (alert fired and investigated), partial (alert fired but not triaged), or missed
3. Calculate overall detection coverage as a percentage of techniques tested
4. Identify patterns in misses (particular tactics, data sources, or detection logic gaps)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
