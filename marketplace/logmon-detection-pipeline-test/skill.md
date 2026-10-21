# Logmon Detection Pipeline Test

Test the incident detection pipeline end to end from event generation to analyst notification.

## Inputs

- `detection-findings`: Alert rule test results
- `integrity-findings`: Log integrity findings

## Outputs

- `pipeline-assessment`: End-to-end assessment of detection pipeline reliability and speed
- `bottleneck-analysis`: Identified bottlenecks in the detection and notification chain

## Process

1. Generate a controlled security event and measure time from event to log ingestion
2. Measure time from ingestion to alert rule evaluation and firing
3. Measure time from alert to analyst notification through the configured channels
4. Test pipeline behavior under load to identify ingestion lag or dropped events

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
