# Hypothesis Formulator

Write the hypothesis as a specific, falsifiable prediction. 'This will improve things' is not a hypothesis. 'Changing the button color from gray to green will increase click-through rate from 3.2% to at least 3.8%' is. The specificity forces you to commit to what you expect before you see the data.

## Inputs

- `experiment-idea`: The change you want to test, in your own words
- `current-metric-value`: The current value of the metric you expect to change

## Outputs

- `hypothesis-statement`: The specific, falsifiable prediction: if we do X, metric Y will change from A to at least B
- `null-hypothesis`: The opposite: the change has no effect, and the metric stays at A

## Process

1. Extract the independent variable (what you are changing) and the dependent variable (what you expect to move). If you cannot name both, the idea is not ready to test.
2. State the hypothesis in the form: 'If [change], then [metric] will [direction] from [baseline] to at least [target].' The target must be a specific number, not 'better.'
3. State the null hypothesis: 'The change has no effect on [metric], which will remain at [baseline] within normal variation.' The experiment's job is to reject the null, not to confirm the hypothesis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
