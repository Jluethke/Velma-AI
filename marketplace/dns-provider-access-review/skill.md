# Dns Provider Access Review

Review access controls on the DNS management platform for unauthorized modification risks.

## Inputs

- `dns-provider-access`: Access to DNS provider console or API
- `zone-list`: List of managed zones

## Outputs

- `access-control-findings`: Weaknesses in DNS provider access controls
- `change-audit-assessment`: Assessment of DNS change logging and audit capabilities

## Process

1. Review who has administrative access to modify DNS records
2. Check for MFA requirements on DNS management accounts
3. Test API key and token permissions for overly broad access
4. Review DNS change audit logging and alerting

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
