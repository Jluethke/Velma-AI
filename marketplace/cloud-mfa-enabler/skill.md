# Cloud Mfa Enabler

Enable multi-factor authentication on the root or global admin account.

## Inputs

- `cloud-provider`: Cloud provider (AWS, Azure, GCP)
- `account-id`: Cloud account or subscription identifier

## Outputs

- `mfa-status`: MFA enrollment status for root and admin accounts
- `mfa-config`: MFA settings applied

## Process

1. Identify the root or global admin account
2. Enable MFA using a hardware token or authenticator application
3. Verify MFA is required for console login
4. Store the MFA recovery codes in a secure location

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
