# Dast Integration Evaluator

Evaluate dynamic analysis integration into the CI/CD pipeline and staging environments.

## Inputs

- `sdlc-security-map`: SDLC security map
- `sast-findings`: SAST coverage findings for comparison

## Outputs

- `dast-findings`: Gaps in DAST coverage and pipeline integration
- `dast-coverage-map`: Which applications and APIs are covered by DAST

## Process

1. Check which applications are scanned by DAST and at what frequency
2. Verify that DAST runs against a staging environment that mirrors production
3. Review scan configurations for authenticated vs unauthenticated testing
4. Check whether DAST findings feed into the same tracking system as SAST

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
