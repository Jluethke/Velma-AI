# Database Hardening Reporter

Produce the database hardening report summarizing all changes and compliance status.

## Inputs

- `database-type`: Database product type
- `patch-report`: Patching results

## Outputs

- `hardening-report`: Full database hardening report
- `compliance-status`: Compliance status against the relevant benchmark

## Process

1. Compile all change logs from each hardening step
2. Run a compliance scan against the CIS database benchmark
3. Document any accepted exceptions with justification
4. Produce the final report with compliance score

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
