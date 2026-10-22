# Control Design Tester

Test whether each control is properly designed to prevent or detect the target risk.

## Inputs

- `control-matrix`: Controls mapped to risks
- `process-narratives`: Process documentation

## Outputs

- `design-test-results`: Assessment of each control's design adequacy
- `design-gaps`: Risks without adequate control coverage

## Process

1. Evaluate whether each control addresses the identified risk.
2. Check for proper segregation of duties (authorization, custody, recording).
3. Identify risks that lack a control or have only a detective (not preventive) control.
4. Assess whether technology controls are properly configured.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
