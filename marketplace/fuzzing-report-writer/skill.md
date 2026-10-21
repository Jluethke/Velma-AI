# Fuzzing Report Writer

Compile the fuzzing campaign results into a structured report with remediation priorities.

## Inputs

- `rated-findings`: Findings with severity ratings
- `coverage-metrics`: What was tested
- `poc-evidence`: Proof-of-concept evidence

## Outputs

- `fuzzing-report`: Complete API fuzzing campaign report
- `remediation-plan`: Prioritized list of fixes with effort estimates

## Process

1. Organize findings by severity and endpoint
2. Include proof-of-concept evidence for each finding
3. Write remediation recommendations prioritized by risk
4. Summarize coverage gaps for future testing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
