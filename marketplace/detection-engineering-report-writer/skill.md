# Detection Engineering Report Writer

Produce the detection engineering report documenting the full lifecycle.

## Inputs

- `deployed-detection`: The deployed detection rule
- `alert-routing-config`: Alert routing and prioritization configuration

## Outputs

- `detection-report`: Full report covering gap analysis, design, testing, and deployment
- `coverage-map-update`: Updated ATT&CK coverage map reflecting the new detection

## Process

1. Document the coverage gap that motivated the detection
2. Record the detection logic, data sources, thresholds, and known limitations
3. Include test results and the analyst runbook for reference
4. Update the ATT&CK coverage map

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
