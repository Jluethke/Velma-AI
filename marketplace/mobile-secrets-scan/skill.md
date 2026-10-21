# Mobile Secrets Scan

Scan the decompiled application and its resources for hardcoded API keys, encryption keys, and credentials.

## Inputs

- `binary-analysis-results`: Decompiled code
- `api-endpoints-discovered`: API endpoints for context

## Outputs

- `secrets-found`: Hardcoded secrets with location and type
- `secret-exposure-impact`: Impact assessment for each exposed secret

## Process

1. Search decompiled code for API key patterns (string entropy, known prefixes).
2. Check resource files, configuration files, and build artifacts for embedded secrets.
3. Test any discovered API keys against their respective services to confirm they are active.
4. Assess the impact of each exposed secret (data access, financial, reputational).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
