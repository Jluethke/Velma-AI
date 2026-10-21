# Deep Link Handling Test

Test deep link and intent handling for vulnerabilities including unauthorized data access and code execution through malicious URIs.

## Inputs

- `binary-analysis-results`: Code analysis showing registered URI schemes and intents
- `platform`: Target platform

## Outputs

- `deep-link-findings`: Deep link and intent handling vulnerabilities
- `uri-attack-surface`: Map of registered URI schemes and their handlers

## Process

1. Enumerate all registered URL schemes, universal links, and intent filters.
2. Test each handler with malformed and malicious input.
3. Check for authorization bypass through direct deep link access to protected screens.
4. Test for data exfiltration through crafted intents or URL parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
