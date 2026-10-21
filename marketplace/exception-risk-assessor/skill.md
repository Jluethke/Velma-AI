# Exception Risk Assessor

Assess the risk introduced by granting the exception.

## Inputs

- `documented-request`: The exception request to assess
- `affected-scope`: What is affected by the exception

## Outputs

- `risk-assessment`: Risk score and analysis for the exception
- `risk-comparison`: Risk with vs without the exception

## Process

1. Identify the threats that the original control mitigates
2. Assess the likelihood and impact of those threats without the control
3. Score the incremental risk introduced by the exception
4. Compare the risk against the business benefit

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
