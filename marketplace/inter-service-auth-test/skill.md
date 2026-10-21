# Inter Service Auth Test

Test authentication and authorization between microservices for identity spoofing and token reuse.

## Inputs

- `cluster-access`: Access to the cluster
- `mesh-config-map`: Service mesh configuration map

## Outputs

- `service-auth-findings`: Inter-service authentication bypass vulnerabilities
- `token-reuse-findings`: Service account token reuse or over-privilege issues

## Process

1. Check Kubernetes service account token mounting and RBAC policies
2. Test for service identity spoofing by forging or replaying tokens
3. Verify that each service enforces authorization on incoming requests
4. Check for overly broad NetworkPolicy or AuthorizationPolicy rules

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
