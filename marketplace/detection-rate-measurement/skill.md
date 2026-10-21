# Detection Rate Measurement

Measure the organization's detection and reporting rate across all social engineering channels.

## Inputs

- `phishing-metrics`: Email campaign metrics
- `phone-test-results`: Phone test outcomes
- `physical-test-results`: Physical access test outcomes

## Outputs

- `detection-rates`: Detection and reporting rates by channel and department
- `response-time-metrics`: Time from attack to detection and from detection to response

## Process

1. Calculate detection rate for each channel (email, phone, physical).
2. Measure time from attack initiation to first employee report.
3. Measure time from employee report to security team response.
4. Break down detection rates by department and role level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
