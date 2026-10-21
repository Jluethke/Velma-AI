# Dns Rebinding Surface Scan

Identify internal services accessible from browser contexts during an authorized test.

## Inputs

- `target-scope`: Authorized target scope and IP ranges
- `engagement-rules`: Rules of engagement for the test

## Outputs

- `internal-service-list`: List of internal services reachable from browser context
- `service-fingerprints`: Fingerprints of each discovered service

## Process

1. Enumerate internal services within authorized scope
2. Identify which services accept browser-originated requests
3. Record ports, protocols, and response characteristics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
