# Hunt Report Writer

Produce the hunt campaign report documenting hypothesis, methods, findings, and new detections.

## Inputs

- `new-detection-rules`: Detection rules created from the hunt
- `coverage-update`: Updated ATT&CK coverage map

## Outputs

- `hunt-report`: Complete threat hunting report with findings, detections, and recommendations
- `hunt-metrics`: Campaign metrics: time spent, data analyzed, findings count, detections created

## Process

1. Summarize the hypothesis, the data sources searched, and the time ranges covered
2. Document each finding with evidence, severity assessment, and remediation action taken
3. List new detection rules with their expected coverage and false positive baselines
4. Calculate campaign metrics for the threat hunting program

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
