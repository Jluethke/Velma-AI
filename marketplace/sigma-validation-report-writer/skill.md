# Sigma Validation Report Writer

Produce the validated Sigma rule with test results and deployment documentation.

## Inputs

- `tuned-sigma-rule`: Final tuned Sigma rule
- `tuning-changelog`: Record of changes and metric impacts

## Outputs

- `validated-sigma-rule`: Production-ready Sigma rule with complete metadata
- `sigma-validation-report`: Test results, tuning history, and deployment guidance

## Process

1. Finalize the rule with complete metadata, references, and false positive documentation
2. Write the validation report: test methodology, dataset sizes, final detection and FP rates
3. Include deployment guidance: recommended SIEM configuration, alert routing, and response procedure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
