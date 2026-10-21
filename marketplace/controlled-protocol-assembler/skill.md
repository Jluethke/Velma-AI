# Controlled Protocol Assembler

Assemble the full controlled experimental protocol: treatment groups, controls, randomization, blinding, and a checklist for execution.

## Inputs

- `positive-control-spec`: Positive control details
- `negative-control-spec`: Negative control details
- `sham-condition-spec`: Sham or placebo details
- `randomization-protocol`: Randomization and blinding plan

## Outputs

- `controlled-protocol`: Complete experimental protocol document
- `execution-checklist`: Step-by-step checklist for running the experiment

## Process

1. Combine all conditions (treatment, positive control, negative control, sham) into a single protocol.
2. Integrate the randomization and blinding procedures.
3. Write the step-by-step execution checklist with decision points and abort criteria.
4. Review for internal consistency: every confound addressed, every group defined.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
