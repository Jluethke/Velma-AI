# Account Persistence Check

Check for persistence mechanisms the attacker may have installed.

## Inputs

- `impact-assessment`: Attacker activity and accessed systems
- `account-details`: Account configuration details

## Outputs

- `persistence-findings`: Any persistence mechanisms found and removed
- `cleanup-log`: Record of all persistence removal actions

## Process

1. Check for email forwarding rules or inbox rules created by the attacker
2. Review OAuth application grants for unauthorized third-party apps
3. Check for API keys or service credentials created during the compromise
4. Remove any identified persistence mechanisms and document each removal

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
