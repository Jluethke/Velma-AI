# Static Analysis Scan

Run static analysis security testing (SAST) tools against the codebase and triage the results.

## Inputs

- `source-repository`: Repository path
- `risk-inventory`: High-risk code areas to focus on

## Outputs

- `sast-findings`: Triaged SAST findings filtered for true positives
- `false-positive-log`: False positives with justification for exclusion

## Process

1. Configure and run SAST tools appropriate for the technology stack.
2. Triage each finding to separate true positives from false positives.
3. Assign severity based on exploitability and data sensitivity.
4. Document false positive rationale for future scan tuning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
