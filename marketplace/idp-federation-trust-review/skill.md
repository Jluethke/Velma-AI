# Idp Federation Trust Review

Review federation trust relationships between identity providers and relying parties for misconfiguration.

## Inputs

- `auth-flow-map`: Map of authentication flows and federation configs
- `protocol-inventory`: List of protocols and their configurations

## Outputs

- `federation-findings`: Misconfigurations in federation trust relationships
- `trust-boundary-map`: Map of trust boundaries and their enforcement

## Process

1. Review SAML metadata exchange and certificate validation
2. Check for overly permissive redirect URI patterns in OAuth configurations
3. Test cross-tenant access controls in multi-tenant environments
4. Verify that assertion consumers validate issuer and audience claims

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
