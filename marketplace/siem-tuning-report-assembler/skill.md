# Siem Tuning Report Assembler

Assemble the SIEM tuning assessment report with before and after coverage metrics.

## Inputs

- `attack-coverage-heatmap`: ATT&CK coverage heatmap
- `tuned-rule-configs`: Tuned rules and their changes
- `new-rule-definitions`: New rules created

## Outputs

- `siem-tuning-report`: Complete SIEM tuning assessment report
- `coverage-improvement-summary`: Summary of coverage improvement before and after tuning

## Process

1. Compile all findings: log source gaps, noisy rules, coverage gaps, new rules
2. Calculate the coverage improvement: techniques covered before vs after
3. Estimate the noise reduction: projected alert volume before vs after tuning
4. Produce the report with executive summary, detailed findings, and implementation timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
