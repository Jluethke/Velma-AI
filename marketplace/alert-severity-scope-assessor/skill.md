# Alert Severity Scope Assessor

Assess the severity and scope of a confirmed true positive alert.

## Inputs

- `tp-fp-determination`: Classification of the alert as true positive
- `determination-evidence`: Evidence supporting the classification

## Outputs

- `severity-assessment`: Final severity rating with justification
- `scope-assessment`: Number of affected systems, users, and data types

## Process

1. Determine the number of affected systems by searching for the same indicators across the environment
2. Assess data exposure risk based on the type of system and data classification
3. Rate final severity (critical, high, medium, low) factoring in asset criticality, data sensitivity, and blast radius

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
