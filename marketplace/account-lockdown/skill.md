# Account Lockdown

Disable the compromised account and revoke all active sessions.

## Inputs

- `compromise-confirmation`: Confirmed account compromise
- `account-details`: Account information for lockdown

## Outputs

- `lockdown-log`: Record of all account lockdown actions
- `session-revocation`: Confirmation that all active sessions are terminated

## Process

1. Disable the account or force a sign-out across all sessions
2. Revoke all OAuth tokens, API keys, and refresh tokens
3. Disable any app passwords or legacy authentication methods
4. Document each lockdown action with timestamp

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
