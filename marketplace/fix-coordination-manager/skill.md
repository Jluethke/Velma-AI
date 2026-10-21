# Fix Coordination Manager

Coordinate the fix with engineering, including timeline and testing.

## Inputs

- `cvss-score`: Severity scores
- `affected-versions`: All affected versions
- `reproduction-result`: Vulnerability details and proof

## Outputs

- `fix-branch`: Code fix ready for review and merge
- `fix-timeline`: Dates for fix completion, testing, and release

## Process

1. Brief the engineering team on the vulnerability without disclosing publicly
2. Set the fix deadline based on severity (critical: 7 days, high: 30 days, medium: 90 days)
3. Review and test the proposed fix for completeness and regression
4. Verify the fix eliminates the vulnerability across all affected versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
