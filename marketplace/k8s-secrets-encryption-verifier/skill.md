# K8S Secrets Encryption Verifier

Verify that secrets are encrypted at rest and properly managed.

## Inputs

- `control-plane-findings`: Control plane configuration findings
- `cluster-access`: Cluster access credentials

## Outputs

- `secrets-findings`: Secrets stored unencrypted, exposed in env vars, or logged
- `secrets-management-status`: Whether external secrets managers are used and configured correctly

## Process

1. Check EncryptionConfiguration for etcd encryption at rest
2. Identify secrets passed as environment variables instead of mounted volumes
3. Check for secrets exposed in container logs or pod specs
4. Verify integration with external secrets managers (Vault, AWS Secrets Manager, Azure Key Vault)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
