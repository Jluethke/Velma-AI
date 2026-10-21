# Cloud Breakglass Creator

Create a break-glass account for emergency access when the primary admin is unavailable.

## Inputs

- `cloud-provider`: Cloud provider
- `mfa-status`: MFA already configured on the primary admin

## Outputs

- `breakglass-account`: Break-glass account details (stored securely)
- `breakglass-procedure`: Documented procedure for using the break-glass account

## Process

1. Create a dedicated break-glass account with admin privileges
2. Configure MFA with a separately stored hardware token
3. Set up alerting for any use of the break-glass account
4. Document the procedure and store credentials in a physical safe or secrets vault

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
