# Database Credential Testing

Test for default credentials, weak passwords, and shared accounts across database instances.

## Inputs

- `database-inventory`: Database instances to test
- `privilege-findings`: Privilege audit results for context

## Outputs

- `credential-findings`: Default, weak, or shared credentials found
- `credential-reuse-map`: Instances sharing the same credentials

## Process

1. Test for default vendor credentials (sa/blank, root/blank, admin/admin).
2. Run dictionary attacks against database accounts using common password lists.
3. Identify shared service accounts used across multiple applications.
4. Check for credential reuse between development and production instances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
