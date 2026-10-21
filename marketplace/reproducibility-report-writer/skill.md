# Reproducibility Report Writer

Write the reproducibility audit report with the verdict, detailed comparison, discrepancy analysis, and recommendations.

## Inputs

- `comparison-table`: full result comparison
- `classified-discrepancies`: discrepancies with causes and severities
- `availability-assessment`: what materials were available

## Outputs

- `audit-report`: complete reproducibility audit report with overall verdict
- `reproducibility-score`: fraction of results exactly or approximately reproduced

## Process

1. State the overall verdict: fully reproducible, partially reproducible, not reproducible
2. Present the comparison table with match status per result
3. Detail each discrepancy with its cause, severity, and whether it affects published conclusions
4. Recommend specific improvements (document seeds, pin versions, provide environment files, release raw data)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
