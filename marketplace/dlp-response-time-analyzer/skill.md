# Dlp Response Time Analyzer

Measure and analyze detection and response times across all exfiltration tests.

## Inputs

- `network-detection-times`: Detection times for network tests
- `endpoint-detection-times`: Detection times for endpoint tests
- `cloud-detection-times`: Detection times for cloud tests
- `encryption-test-results`: Results for encrypted channel tests

## Outputs

- `response-time-analysis`: Statistical summary of detection and response times
- `coverage-gap-summary`: Channels with no detection or slow detection

## Process

1. Compute mean, median, and 95th percentile detection times per channel
2. Identify channels with zero detection (complete gaps)
3. Categorize gaps by severity (blocked, alerted, logged only, undetected)
4. Rank improvements by the volume of data at risk through each gap

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
