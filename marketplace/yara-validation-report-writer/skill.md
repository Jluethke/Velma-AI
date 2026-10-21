# Yara Validation Report Writer

Produce the validated YARA rule package with documentation and test results.

## Inputs

- `optimized-yara-rule`: Final optimized YARA rule
- `optimization-changelog`: Record of changes and metric impacts

## Outputs

- `validated-rule-package`: Production-ready YARA rule with metadata and documentation
- `validation-report`: Full report with detection rate, false positive rate, and test methodology

## Process

1. Package the final rule with complete metadata fields
2. Write the validation report: test methodology, corpus sizes, detection rate, false positive rate
3. Include deployment guidance: which scanning platforms, recommended scan frequency, alert priority

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
