# Race Condition Report

Compile race condition test results into a prioritized security report.

## Inputs

- `exploitation-evidence`: Successful exploitation evidence
- `toctou-results`: TOCTOU findings
- `db-race-results`: Database race condition findings

## Outputs

- `race-condition-report`: Prioritized race condition vulnerability report
- `race-remediation-guide`: Remediation for each race condition finding

## Process

1. Rank findings by financial impact and exploitability
2. Document the exploitation steps and success rate for each finding
3. Write remediation guidance (database locks, idempotency keys, atomic operations)
4. Produce the final report with proof-of-concept evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
