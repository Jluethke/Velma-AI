# Admin Credential Hygiene Checker

Check administrative credential hygiene and privileged access management.

## Inputs

- `critical-systems-list`: Critical systems list
- `network-architecture`: Network tiers and admin access patterns

## Outputs

- `credential-hygiene-findings`: Shared admin accounts, stale credentials, and missing MFA
- `pam-status`: Privileged access management coverage and configuration

## Process

1. Check for shared local administrator passwords across endpoints
2. Verify MFA enforcement on all administrative access paths
3. Check for service accounts with interactive logon rights and non-rotating passwords
4. Assess privileged access workstation and tiered administration compliance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
