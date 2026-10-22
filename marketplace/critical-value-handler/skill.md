# Critical Value Handler

Identify and route critical or panic values.

## Inputs

- `flagged-values`: Abnormal results
- `patient-id`: Patient identifier

## Outputs

- `critical-alerts`: Critical values requiring immediate action
- `urgent-values`: Significantly abnormal but not critical values

## Process

1. Check flagged values against the critical value list.
2. Route critical values to the provider for immediate notification.
3. Log the notification time for compliance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
