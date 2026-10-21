# Api Error Disclosure Check

Check API error responses for information disclosure including stack traces, internal paths, database details, and version information.

## Inputs

- `input-validation-findings`: Input validation failures that trigger error responses
- `endpoint-map`: Map of all endpoints

## Outputs

- `disclosure-findings`: Information leakage found in error responses
- `exposed-internals`: Internal details exposed (paths, versions, stack traces)

## Process

1. Trigger error conditions on each endpoint and capture the full response.
2. Check for stack traces, internal file paths, and database query fragments.
3. Look for version numbers, framework names, and server configuration details.
4. Verify that production error responses use generic messages without internal details.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
