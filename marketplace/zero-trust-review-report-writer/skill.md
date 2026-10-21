# Zero Trust Review Report Writer

Compile the zero trust architecture review report.

## Inputs

- `identity-gap-list`: Identity verification gaps
- `microsegmentation-findings`: Microsegmentation gaps
- `continuous-auth-findings`: Continuous auth issues
- `legacy-bypass-findings`: Legacy bypass paths

## Outputs

- `zero-trust-review-report`: Complete zero trust architecture review report
- `zero-trust-maturity-score`: Maturity score across zero trust pillars with improvement plan

## Process

1. Score the implementation against zero trust maturity model pillars (identity, device, network, application, data)
2. Summarize findings by pillar with severity rankings
3. Produce the improvement plan with priorities based on risk reduction per effort
4. Include a roadmap from current state to target zero trust maturity level

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
