# Three Question Scorer

Score each metric on three questions. Usage: does anyone look at it? Actionability: does anyone act on it? Relevance: does it align with a current goal? A metric that scores zero on all three is pure debt.

## Inputs

- `measurement-inventory`: All tracked metrics with their details

## Outputs

- `scored-metrics`: Each metric with its usage, actionability, and relevance scores (0 or 1 for each)
- `debt-candidates`: Metrics scoring 0 on all three questions, identified as measurement debt

## Process

1. Usage: has anyone looked at this metric in the last 30 days? Check access logs, meeting agendas, or ask the team. If no one has looked at it, score 0.
2. Actionability: in the last 90 days, did anyone change a plan, allocate a resource, or start/stop something because of this metric? If no, score 0.
3. Relevance: does this metric align with a current goal, OKR, priority, or personal objective? If it tracks something that was a priority 6 months ago but is not anymore, score 0.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
