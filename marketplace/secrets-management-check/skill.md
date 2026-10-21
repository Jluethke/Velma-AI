# Secrets Management Check

Check how secrets are stored, rotated, and accessed in the container environment.

## Inputs

- `rbac-findings`: RBAC findings for access context
- `network-policy-findings`: Network isolation context

## Outputs

- `secrets-findings`: Insecure secret storage and access patterns
- `rotation-status`: Secret rotation compliance and age report

## Process

1. Check for secrets stored as plain Kubernetes Secrets (base64, not encrypted at rest).
2. Verify that etcd encryption is enabled for secret storage.
3. Review which pods and service accounts can access which secrets.
4. Check secret age and rotation policies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
