# Api Key Policy Writer

Write the API key policy covering generation, scoping, and lifecycle.

## Inputs

- `api-inventory`: The APIs that require authentication
- `consumer-model`: How consumers are organized (accounts, projects, environments)

## Outputs

- `key-policy`: API key policy: format, scoping (per-project, per-environment), permissions model, expiration rules
- `key-format-spec`: Key format specification (prefix, entropy, encoding, length)

## Process

1. Define the key format: prefix for identification (sk_live_, sk_test_), sufficient entropy (256 bits), base62 encoding.
2. Define the scoping model: keys scoped to projects, environments (live vs. test), and permission sets.
3. Set expiration rules: maximum lifetime, rotation reminders, grace period after expiration.
4. Define the permissions model: what each key can access based on its scope.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
