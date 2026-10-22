# Automated Capture Configurator

Configure automated event capture where possible.

## Inputs

- `event-taxonomy`: Event types and severities
- `recording-protocol`: How entries are recorded

## Outputs

- `automation-plan`: Which events can be captured automatically and how
- `manual-capture-list`: Events that require manual recording

## Process

1. Identify events that can be captured from existing systems (CI/CD, monitoring, ticketing).
2. Design the integration for each automated source.
3. List events that remain manual and assign owners.
4. Produce the automation plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
