# Waf Bypass Report

Compile WAF bypass testing results into a prioritized report.

## Inputs

- `encoding-bypass-results`: Encoding bypass findings
- `chunked-bypass-results`: Chunked encoding and smuggling findings
- `mutation-bypass-results`: Payload mutation bypass findings

## Outputs

- `waf-bypass-report`: Prioritized WAF bypass testing report
- `waf-tuning-guide`: WAF rule tuning recommendations for each bypass

## Process

1. Rank bypasses by the severity of the underlying vulnerability they expose
2. Document the bypass technique and payload for each finding
3. Write WAF tuning recommendations (custom rules, normalization, parser alignment)
4. Produce the final report with before/after rule recommendations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
