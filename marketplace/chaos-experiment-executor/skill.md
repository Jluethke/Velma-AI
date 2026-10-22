# Chaos Experiment Executor

Execute the chaos experiment by injecting the failure while monitoring system behavior.

## Inputs

- `injection-plan`: The failure injection configuration
- `measurement-plan`: How to measure system behavior

## Outputs

- `experiment-observations`: Raw observations during the experiment
- `metric-timeseries`: Time series of all measured metrics during the experiment

## Process

1. Start monitoring and recording all metrics
2. Inject the failure according to the plan
3. Observe system behavior and record any anomalies
4. Terminate the injection (or let safety limits trigger rollback)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
