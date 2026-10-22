# Leading Signal Identification

From the driver tree, identify which drivers are leading indicators: the ones that change BEFORE the outcome moves. A leading indicator has two properties: it is measurable before the outcome changes, and changes in it predict changes in the outcome.

## Inputs

- `driver-tree`: The decomposition from outcome down to daily behaviors
- `driver-levels`: How many levels deep the tree goes

## Outputs

- `candidate-leading-indicators`: List of drivers that change before the outcome, with the estimated lead time for each
- `lead-time-estimates`: For each candidate, the estimated delay between the indicator moving and the outcome moving

## Process

1. For each driver in the tree, estimate the time lag between when it changes and when the outcome changes. Drivers closer to the leaves have longer lead times.
2. Filter to drivers where the lead time is long enough to act on. A leading indicator with a 1-day lead time on a quarterly goal is useful. A 1-hour lead time is noise.
3. For each candidate, ask: can I measure this reliably, at least weekly? If not, it is theoretically leading but practically useless.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
