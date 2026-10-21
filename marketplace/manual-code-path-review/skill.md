# Manual Code Path Review

Manually review flagged code paths for vulnerabilities that static analysis cannot detect, including race conditions and logic errors.

## Inputs

- `sast-findings`: SAST results to guide manual review
- `risk-inventory`: High-risk code areas

## Outputs

- `manual-review-findings`: Vulnerabilities found through manual code review
- `code-quality-notes`: Security-relevant code quality observations

## Process

1. Trace data flows from user input to sensitive operations (sinks).
2. Check for race conditions in concurrent code paths.
3. Review error handling for information leakage and fail-open conditions.
4. Verify that security controls are applied consistently across similar code paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
