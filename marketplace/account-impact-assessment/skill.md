# Account Impact Assessment

Assess what the attacker accessed or modified while using the compromised account.

## Inputs

- `lockdown-log`: Confirmation the account is locked down
- `indicator-summary`: Compromise indicators and timeline

## Outputs

- `impact-assessment`: List of data and systems accessed by the attacker
- `attacker-activity-timeline`: Timeline of attacker actions in the account

## Process

1. Review audit logs for all actions taken during the compromise window
2. Identify emails read, sent, or forwarded by the attacker
3. Check for data downloads, file access, or modifications
4. Determine if the attacker used the account to pivot to other systems

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
