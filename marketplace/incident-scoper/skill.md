# Incident Scoper

Scope the incident to determine affected systems, data, users, and timeframe.

## Inputs

- `incident-trigger`: Initial alert or report that triggered the investigation
- `initial-indicators`: Known indicators of compromise from the triggering event

## Outputs

- `incident-scope`: Defined scope: affected systems, users, data types, and time window
- `investigation-plan`: Plan for evidence collection and analysis priorities

## Process

1. Identify all systems that communicated with known malicious indicators
2. Determine which user accounts were involved or potentially compromised
3. Classify the data types at risk on affected systems
4. Define the investigation time window from earliest indicator to present

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
