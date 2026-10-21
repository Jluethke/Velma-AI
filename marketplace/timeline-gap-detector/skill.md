# Timeline Gap Detector

Identify gaps and anomalies in the timeline that may indicate anti-forensics or missing evidence.

## Inputs

- `unified-timeline`: The merged timeline
- `merge-statistics`: Event density statistics

## Outputs

- `gap-analysis`: Identified gaps, anomalies, and their possible explanations
- `annotated-timeline`: Timeline annotated with gap and anomaly markers

## Process

1. Detect periods with significantly fewer events than baseline
2. Identify timestamp sequences that are out of order (timestomping)
3. Check for log truncation or clearing events
4. Assess whether gaps align with known system downtime or evidence gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
