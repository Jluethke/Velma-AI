# Linux Credential Harvesting Check

Check for credential files, SSH keys, and sensitive data readable by the current user.

## Inputs

- `linux-user-context`: Current user access level
- `capabilities-findings`: Capabilities findings for combined paths

## Outputs

- `credential-findings`: Readable credentials, keys, and sensitive configuration files
- `lateral-movement-opportunities`: Credentials usable for lateral movement or escalation

## Process

1. Search for readable private SSH keys, .bash_history, and .netrc files
2. Check for passwords in configuration files, environment variables, and process listings
3. Look for database credentials in application config files
4. Identify credentials that grant access to higher-privilege accounts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
