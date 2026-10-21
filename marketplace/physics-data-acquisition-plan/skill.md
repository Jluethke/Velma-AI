# Physics Data Acquisition Plan

Plan the data acquisition: sampling rate, number of runs, recording format, real-time monitoring, and abort criteria.

## Inputs

- `experiment-protocol`: The procedure being executed
- `apparatus-schematic`: Instruments and their connections
- `uncertainty-budget`: Required measurement count for statistical power

## Outputs

- `acquisition-plan`: Sampling rates, channels, file format, run count, and storage estimate
- `monitoring-dashboard-spec`: Real-time quantities to display for operator decisions
- `abort-criteria`: Conditions that stop data taking (drift, saturation, anomaly)

## Process

1. Set sampling rate per channel based on signal bandwidth
2. Define number of independent runs for the target statistical uncertainty
3. Specify file format, naming convention, and storage estimate
4. Design a real-time monitoring display for key diagnostics
5. Define abort criteria and recovery procedures

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
