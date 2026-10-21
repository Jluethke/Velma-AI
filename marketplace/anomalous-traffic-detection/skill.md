# Anomalous Traffic Detection

Detect anomalous traffic patterns that may indicate compromise or misuse.

## Inputs

- `pcap-files`: Captured traffic
- `protocol-inventory`: Observed protocols

## Outputs

- `anomaly-list`: Detected traffic anomalies with severity ratings
- `baseline-deviation`: How observed traffic deviates from expected baselines

## Process

1. Establish traffic baselines by protocol, volume, and timing
2. Detect outliers: unusual volumes, odd hours, unexpected destinations
3. Flag traffic patterns associated with known attack techniques

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
