# Regression Report

Produce the security regression test report.

## Inputs

- `security-delta`: Net security change
- `broken-controls`: Controls that failed
- `coverage-gaps`: Testing coverage gaps

## Outputs

- `regression-report`: Complete security regression test report
- `go-nogo-recommendation`: Whether the changes are safe to deploy

## Process

1. Compile all findings: regressions, new issues, broken controls
2. Write the go/no-go recommendation with supporting evidence
3. List specific items that must be fixed before deployment
4. Update the security baseline with new test cases

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
