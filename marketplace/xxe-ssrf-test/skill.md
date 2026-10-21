# Xxe Ssrf Test

Check for SSRF through XXE by targeting internal network endpoints via entity declarations.

## Inputs

- `dos-results`: DoS test results
- `file-read-results`: File read results

## Outputs

- `ssrf-results`: SSRF through XXE test results
- `internal-services-reached`: Internal services accessed through XXE SSRF

## Process

1. Inject entities targeting internal IP ranges and cloud metadata endpoints
2. Test for port scanning through XXE response timing
3. Assess the scope of internal network access gained

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
