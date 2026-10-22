# Visualization Fitness Review

Check whether each visualization type matches the question the metric answers. Lines show trends over time. Bars compare categories. Numbers show current state. Pie charts almost never show anything useful. Using the wrong visualization makes the data harder to read, not easier.

## Inputs

- `frequency-matched`: Metrics with correct update frequency

## Outputs

- `visualization-assessment`: For each metric: whether the current visualization type matches the analytical question, and the recommended change if not
- `layout-recommendations`: How to arrange the surviving metrics on the dashboard for readability

## Process

1. For each metric, identify the question it answers: 'what is the current value?' (use a number or gauge), 'how has it changed over time?' (use a line chart), 'how do categories compare?' (use a bar chart), 'what is the distribution?' (use a histogram).
2. Flag pie charts. In almost every case, a bar chart conveys the same information more accurately because humans compare lengths better than angles.
3. Arrange the layout: the most important metric (the one with the most action history) goes top-left. Group related metrics together. Leave white space between groups.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
