# False Positive Tuner

Tune security tools to reduce false positive rates to an acceptable level without missing true positives.

## Inputs

- `pipeline-definition`: Pipeline definition with security stages
- `tool-configurations`: Current configuration files for security tools

## Outputs

- `tuned-configurations`: Updated tool configurations with suppressed false positives and tuned rules
- `tuning-metrics`: False positive rate before and after tuning, with true positive validation

## Process

1. Run the tools against the codebase and classify each finding as true or false positive.
2. Suppress known false positives with inline annotations or configuration exclusions.
3. Re-run and measure the false positive rate, validating that true positives are still caught.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
