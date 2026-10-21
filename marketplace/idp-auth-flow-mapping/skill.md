# Idp Auth Flow Mapping

Map all authentication flows including SAML, OIDC, and OAuth configurations across the identity provider.

## Inputs

- `idp-access`: Access to identity provider configuration and documentation
- `scope-definition`: Which applications and flows are in scope

## Outputs

- `auth-flow-map`: Diagram and inventory of all authentication flows and their configurations
- `protocol-inventory`: List of protocols in use with version and configuration details

## Process

1. Enumerate all configured applications and their authentication protocols
2. Map the redirect URIs, scopes, and grant types for each OAuth/OIDC application
3. Document SAML assertion configurations and attribute mappings
4. Identify custom authentication policies and conditional access rules

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
