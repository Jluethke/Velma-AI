# Framework Alignment Checker

Align the draft policy against an established framework such as NIST CSF or ISO 27001.

## Inputs

- `draft-policy`: The policy draft to align
- `target-framework`: The framework to align against (NIST, ISO 27001, etc.)

## Outputs

- `alignment-report`: Gap analysis showing coverage and missing controls
- `aligned-policy`: Policy updated to close identified gaps

## Process

1. Map each policy control to the corresponding framework control
2. Identify gaps where framework controls lack policy coverage
3. Update the policy to address identified gaps
4. Verify alignment completeness

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
