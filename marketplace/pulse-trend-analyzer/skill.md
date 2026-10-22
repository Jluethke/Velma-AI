# Pulse Trend Analyzer

Analyze pulse survey trends by team, dimension, and time period.

## Inputs

- `pulse-responses`: Responses for the current and prior cycles
- `participation-metrics`: Response rates for context

## Outputs

- `dimension-scores`: Average scores by dimension, team, and tenure band
- `trend-analysis`: Score trends over the last 6 to 12 cycles with significant changes flagged

## Process

1. Calculate the average score for each dimension and team.
2. Compare to prior cycles and flag statistically significant changes.
3. Identify teams with consistently low or declining scores.
4. Analyze open-text comments for recurring themes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
