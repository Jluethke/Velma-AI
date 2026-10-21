# Gcp Cloud Function Injection Test

Test Cloud Functions for event injection through Pub/Sub, Cloud Storage, and HTTP triggers.

## Inputs

- `project-ids`: Projects containing Cloud Functions
- `iam-binding-map`: IAM bindings to identify function permissions

## Outputs

- `function-injection-findings`: Injection vulnerabilities in Cloud Functions
- `function-permission-issues`: Overprivileged function execution roles

## Process

1. Enumerate all Cloud Functions, their triggers, and runtime configurations
2. Test HTTP-triggered functions for authentication bypass
3. Attempt event injection through Pub/Sub topics and Cloud Storage triggers
4. Check function source code for secrets and the execution service account for privilege

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
