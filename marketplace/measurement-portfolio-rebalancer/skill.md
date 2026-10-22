# Measurement Portfolio Rebalancer

Assemble the rebalanced measurement portfolio: the surviving old metrics, the new gap-filling metrics, and the retired debt metrics. The result is a measurement system that tracks what matters, ignores what does not, and has no blind spots on current goals.

## Inputs

- `scored-metrics`: Surviving old metrics
- `new-metrics`: Gap-filling metrics for blind spots
- `retired-metrics`: Debt metrics being stopped

## Outputs

- `rebalanced-portfolio`: The complete measurement portfolio: every active metric with its source, frequency, target, and action protocol
- `audit-report`: The full audit report: what was tracked, what was retired (with savings), what was added (with cost), and the net change in measurement quality

## Process

1. Combine the surviving metrics and the new metrics into a single portfolio. For each metric: name, source, frequency, target, action protocol, owner.
2. Calculate the net change: metrics removed, metrics added, cost saved, cost added, blind spots closed. A good audit reduces total metrics while increasing coverage of current goals.
3. Schedule the next audit (quarterly for fast-changing areas, semi-annually for stable ones). Measurement portfolios drift over time as goals change and metrics accumulate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
