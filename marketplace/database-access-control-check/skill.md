# Database Access Control Check

Check database authentication mechanisms for strength, including password policies, network restrictions, and multi-factor requirements.

## Inputs

- `database-inventory`: Database instances to audit
- `patch-status`: Patch level context

## Outputs

- `auth-control-findings`: Authentication weaknesses found
- `network-access-findings`: Network-level access control issues

## Process

1. Check authentication methods (password, certificate, Kerberos, LDAP integration).
2. Verify that password policies enforce minimum complexity and rotation.
3. Check network-level access restrictions (listen addresses, pg_hba.conf, bind addresses).
4. Test for anonymous or unauthenticated access to any database instance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
