# Authn Authz Architecture Evaluator

Evaluate the authentication and authorization architecture for design weaknesses.

## Inputs

- `component-inventory`: List of system components
- `trust-boundary-map`: Trust boundary map from prior step

## Outputs

- `authn-assessment`: Assessment of authentication mechanisms across all entry points
- `authz-assessment`: Assessment of authorization model and enforcement points

## Process

1. Catalog all authentication mechanisms in use (passwords, tokens, certificates, MFA)
2. Trace the authorization model from request to resource access
3. Check for consistent enforcement at every trust boundary crossing
4. Identify any paths that bypass authentication or authorization checks

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
