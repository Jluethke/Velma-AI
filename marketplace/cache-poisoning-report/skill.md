# Cache Poisoning Report

Compile cache poisoning test results into a prioritized security report.

## Inputs

- `stored-xss-results`: Stored XSS results
- `cache-dos-results`: DoS results
- `isolation-results`: Cache isolation results

## Outputs

- `cache-poison-report`: Prioritized cache poisoning vulnerability report
- `cache-remediation-guide`: Remediation steps for each finding

## Process

1. Rank findings by impact (XSS > data leakage > DoS) and exploitability
2. Document proof-of-concept steps for each vulnerability
3. Write remediation guidance (cache key normalization, Vary headers, input validation)
4. Produce the final report with timeline and severity ratings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
