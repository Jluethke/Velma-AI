# Ssrf Basic Internal Scan

Test for basic SSRF by attempting to reach internal network addresses through each identified input.

## Inputs

- `ssrf-surface-map`: Endpoints and parameters accepting URL input
- `request-flow-diagram`: Server-side request processing flow

## Outputs

- `internal-scan-results`: Responses from internal addresses confirming SSRF
- `reachable-services`: Internal services reachable through the SSRF

## Process

1. Test each parameter with localhost, 127.0.0.1, and common internal ranges
2. Use an external collaborator server to confirm out-of-band SSRF
3. Probe common internal service ports (80, 443, 8080, 6379, 9200, 3306)
4. Document which internal services respond and what data is returned

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
