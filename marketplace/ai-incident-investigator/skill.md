# Ai Incident Investigator

Investigate the root cause of the incident.

## Inputs

- `incident-classification`: Incident type
- `system-state`: State after mitigation

## Outputs

- `root-cause`: Identified root cause with evidence
- `investigation-log`: Timeline and evidence collected

## Process

1. Collect logs, model outputs, and input data from the incident window.
2. Reproduce the failure in a test environment.
3. Identify the root cause (data drift, prompt issue, model degradation, adversarial input).
4. Document the investigation timeline and evidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
