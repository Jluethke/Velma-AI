# Ssrf Blind Detection

Test for blind SSRF using timing analysis and DNS callback techniques.

## Inputs

- `ssrf-surface-map`: All URL-accepting parameters
- `protocol-smuggling-results`: Protocol smuggling test results

## Outputs

- `blind-ssrf-results`: Blind SSRF endpoints confirmed through timing or DNS
- `dns-callback-evidence`: DNS resolution logs proving server-side requests

## Process

1. Set up a DNS callback server to detect out-of-band requests
2. Test each parameter with unique callback hostnames
3. Measure response timing differences between reachable and unreachable hosts
4. Classify each finding as full SSRF, blind SSRF, or DNS-only SSRF

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
