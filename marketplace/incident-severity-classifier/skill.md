# Incident Severity Classifier

Classify the incident severity to determine the notification audience and cadence.

## Inputs

- `incident-details`: Description of the incident (what is affected, when it started, current impact)
- `severity-criteria`: Criteria for each severity level (SEV1 through SEV4)

## Outputs

- `severity-level`: Assigned severity level for this incident
- `notification-audience`: List of stakeholder groups to notify based on severity

## Process

1. Evaluate the incident against the severity criteria: customer impact, revenue impact, data integrity, service availability.
2. Assign the severity level (SEV1: total outage; SEV2: major degradation; SEV3: partial issue; SEV4: minor).
3. Map the severity to the notification audience (SEV1: all stakeholders including executives; SEV4: engineering only).
4. Record the classification rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
