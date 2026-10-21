# Privesc Idor Check

Check for insecure direct object references that allow accessing resources by manipulating identifiers.

## Inputs

- `application-access`: Test accounts with known resource ownership
- `horizontal-findings`: Horizontal escalation findings for context

## Outputs

- `idor-findings`: Endpoints vulnerable to insecure direct object reference
- `id-scheme-assessment`: Assessment of identifier predictability and authorization checking

## Process

1. Identify all API endpoints that accept object identifiers
2. Test each endpoint with identifiers belonging to other users or resources
3. Check whether sequential, UUIDv1, or otherwise predictable identifiers are used
4. Verify server-side authorization checks on each object access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
