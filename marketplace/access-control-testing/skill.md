# Access Control Testing

Test authorization and access controls for privilege escalation, insecure direct object references, and missing function-level access controls.

## Inputs

- `endpoint-inventory`: List of discovered endpoints
- `auth-findings`: Authentication weaknesses that may enable access control bypass

## Outputs

- `access-control-findings`: List of authorization bypass vulnerabilities
- `access-control-evidence`: Proof-of-concept for each access control finding

## Process

1. Test horizontal privilege escalation by accessing resources belonging to other users.
2. Test vertical privilege escalation by attempting admin-level actions from a low-privilege account.
3. Check for insecure direct object references across all parameterized endpoints.
4. Verify that all sensitive functions enforce server-side authorization checks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
