# New Detection Rule Creator

Create new correlation rules for previously uncovered ATT&CK techniques.

## Inputs

- `uncovered-techniques`: Techniques needing new detection rules
- `log-source-inventory`: Available data sources for rule logic

## Outputs

- `new-rule-definitions`: New rule definitions ready for deployment
- `data-source-requests`: Requests for new data sources needed by rules that cannot be written with current data

## Process

1. For each prioritized technique, determine which data sources provide visibility
2. Write the detection logic using available log fields
3. Set initial thresholds conservatively to avoid alert fatigue
4. Flag techniques where detection requires a data source not yet ingested

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
