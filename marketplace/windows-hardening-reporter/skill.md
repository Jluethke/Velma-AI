# Windows Hardening Reporter

Run a final compliance scan and produce the Windows Server hardening report.

## Inputs

- `baseline-scan`: Initial compliance scan before hardening
- `benchmark-profile`: The benchmark used for hardening

## Outputs

- `hardening-report`: Full hardening report with compliance score and remaining exceptions
- `compliance-score`: Final percentage compliance against the benchmark

## Process

1. Run the final compliance scan against the same benchmark
2. Compare before and after scores
3. Document any accepted exceptions with justification
4. Produce the hardening report with the compliance score and change log

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
