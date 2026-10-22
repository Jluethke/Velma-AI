# Configuration Audit Execution

Execute functional and physical configuration audits to verify that the product matches its documentation and that all requirements are verified.

## Inputs

- `change-impact-analysis`: Change history and impact records
- `ccb-package`: CCB decisions and implementation records

## Outputs

- `functional-audit-results`: Verification that every requirement in the functional and allocated baselines has been tested and the results documented, with all discrepancies resolved
- `physical-audit-results`: Verification that the as-built product matches the as-designed documentation: every component on the board matches the BOM, every software module matches the released version, every drawing reflects the actual product
- `audit-discrepancy-list`: Every discrepancy found, classified as documentation error (update the docs) or product nonconformance (fix the product), with resolution status

## Process

1. Conduct the functional configuration audit (FCA) by reviewing the verification cross-reference matrix. For every requirement in the baseline, confirm that a test or analysis exists, that it was executed, and that the result meets the requirement. Flag any requirement that was not verified, verified with a deviation, or verified with an open discrepancy.
2. Conduct the physical configuration audit (PCA) by comparing the as-built product to its released documentation. For hardware: verify the BOM against the actual board (every component matches part number, value, and revision). For software: verify the build matches the released source code and configuration (reproducible build). For firmware: verify the programmed image matches the released binary.
3. For each discrepancy, determine whether the documentation is wrong (the product is correct but the drawing needs updating) or the product is wrong (the product was built or configured incorrectly). Documentation errors are corrected by engineering change. Product nonconformances go through the material review board (MRB) for disposition: use as is, rework, repair, scrap, or return to vendor.
4. Close the audit by confirming all discrepancies are resolved and the product baseline accurately reflects the product being delivered. The audit is the gate between development and production: passing it means the product definition is complete and controlled.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
