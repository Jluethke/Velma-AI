# Structure Proposer

Propose or confirm the molecular structure by combining chemical shift assignments, coupling patterns, integration ratios, and any 2D NMR data.

## Inputs

- `shift-assignments`: Functional group assignments
- `connectivity-constraints`: Coupling-based connectivity
- `integration-table`: Proton counts per environment

## Outputs

- `proposed-structure`: The proposed molecular structure with atom numbering
- `assignment-table`: Each NMR peak matched to a specific atom or group in the structure

## Process

1. Assemble fragments from the shift and coupling data.
2. Connect fragments using coupling patterns and degrees of unsaturation.
3. Verify the proposed structure: predict the expected NMR pattern and compare to observed.
4. Produce the final assignment table mapping each peak to a specific hydrogen in the structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
