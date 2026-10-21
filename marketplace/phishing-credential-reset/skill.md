# Phishing Credential Reset

Reset credentials and revoke sessions for users who submitted credentials to the phishing site.

## Inputs

- `interaction-list`: Users who clicked or submitted credentials
- `ioc-list`: Phishing URLs and domains for context

## Outputs

- `reset-log`: Record of all credential resets and session revocations
- `user-notifications`: Notifications sent to affected users

## Process

1. Force password reset for all users who submitted credentials
2. Revoke all active sessions and OAuth tokens for affected accounts
3. Enable or verify MFA on affected accounts
4. Notify each affected user with instructions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
