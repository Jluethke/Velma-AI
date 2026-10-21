# Email Access Controls Review

Review mailbox access controls, delegation settings, and administrative permissions.

## Inputs

- `email-system-info`: Email platform details and admin access
- `filter-bypass-findings`: Content filtering findings for context

## Outputs

- `access-findings`: Mailbox access control weaknesses
- `delegation-map`: Map of mailbox delegations and shared access

## Process

1. Review administrative access to email management consoles
2. Check mailbox delegation and send-as permissions
3. Test mail flow rules and transport rules for data leakage risks
4. Review auto-forwarding rules for unauthorized external forwarding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
