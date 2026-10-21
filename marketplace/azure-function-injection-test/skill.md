# Azure Function Injection Test

Test Azure Functions for event injection, insecure triggers, and function-level authorization bypass.

## Inputs

- `subscription-resource-map`: Resource inventory to locate function apps
- `storage-exposure-findings`: Storage paths that may trigger functions

## Outputs

- `function-injection-findings`: Identified injection and bypass vulnerabilities in functions
- `trigger-abuse-results`: Results of trigger manipulation attempts

## Process

1. Enumerate all function apps, their triggers, and authorization levels
2. Test HTTP-triggered functions for missing or bypassable authentication
3. Attempt event injection through queue, blob, and event grid triggers
4. Check for secrets and credentials in function application settings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
