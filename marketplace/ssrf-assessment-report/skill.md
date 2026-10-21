# Ssrf Assessment Report

Compile SSRF assessment findings into a prioritized report with remediation guidance.

## Inputs

- `internal-scan-results`: Internal network access results
- `metadata-access-results`: Cloud metadata access results
- `filter-bypass-results`: Filter bypass results

## Outputs

- `ssrf-report`: Prioritized SSRF vulnerability assessment report
- `ssrf-remediation-guide`: Remediation steps for each SSRF finding

## Process

1. Rank findings by impact (credential exposure > internal access > blind SSRF)
2. Document the full exploitation chain for each finding
3. Write remediation guidance (allowlisting, IMDSv2, network segmentation)
4. Produce the final report with proof-of-concept steps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
