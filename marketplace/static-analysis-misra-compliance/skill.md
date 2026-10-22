# Static Analysis Misra Compliance

Configure static analysis tools for MISRA C compliance, define the rule set for the project, handle deviations, and integrate into the CI pipeline.

## Inputs

- `ci-pipeline-design`: CI pipeline to add static analysis stage
- `firmware-architecture`: Code modules with their safety criticality classification

## Outputs

- `misra-configuration`: MISRA C:2012 rule selection (mandatory, required, advisory), tool configuration (PC-lint, Polyspace, cppcheck, or Parasoft), and suppression/deviation policy
- `testing-methodology-document`: Complete testing strategy: unit tests, HIL, fixed-point, CI, coverage, static analysis, and the traceability from requirements through tests to coverage evidence

## Process

1. Select the MISRA C:2012 rule set. All 10 mandatory rules must be enforced with zero deviations. The 143 required rules should be enforced with documented deviations where necessary. The 30 advisory rules: enable the ones relevant to the project (pointer arithmetic, implicit conversions, side effects in macros) and document why others are excluded.
2. Configure the static analysis tool. For open-source: cppcheck with MISRA addon provides good coverage of required rules. For commercial: PC-lint Plus or Polyspace provide higher coverage and fewer false positives. Configure the tool to use the project's target compiler settings (data type sizes, endianness, alignment) for accurate analysis.
3. Handle deviations: when a required rule must be violated (e.g., Rule 11.3 prohibits pointer casts, but register access requires casting integer addresses to pointers), document the deviation: which rule, where in the code, why the deviation is necessary, and what mitigation ensures safety (e.g., the cast is in a controlled macro used only for register access).
4. Integrate into CI: run static analysis on every commit. New violations added by the commit fail the pipeline. Existing violations (in the baseline) are tracked but do not fail the build. The baseline shrinks over time as violations are fixed. This prevents regression while allowing gradual improvement.
5. Document the complete testing methodology: traceability from each requirement to the test(s) that verify it, the test level (unit/integration/system/HIL), the coverage evidence, and the static analysis clean report. This document is required for safety certification (IEC 61508, ISO 26262) and serves as the verification summary for the project.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
