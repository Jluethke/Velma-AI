# Nosql Db Identify

Identify NoSQL databases in use and their interaction points in the application.

## Inputs

- `target-application`: Target application URL
- `engagement-scope`: Authorized test scope

## Outputs

- `nosql-inventory`: Inventory of NoSQL databases and their types
- `injection-points`: Application endpoints that interact with NoSQL stores

## Process

1. Fingerprint database types from error messages and response patterns
2. Identify endpoints that accept structured input (JSON, query strings)
3. Map each endpoint to its likely database interaction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
