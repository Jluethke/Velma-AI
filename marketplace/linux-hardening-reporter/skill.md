# Linux Hardening Reporter

Run a final compliance scan and produce the Linux server hardening report.

## Inputs

- `baseline-scan`: Initial compliance scan before hardening
- `benchmark-profile`: The benchmark used for hardening

## Outputs

- `hardening-report`: Full hardening report with compliance score and remaining items
- `compliance-score`: Final percentage compliance against the benchmark

## Process

1. Run the final compliance scan with the same tool and benchmark
2. Compare before and after results
3. Document accepted exceptions with justification
4. Produce the report with the compliance score and all change logs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
