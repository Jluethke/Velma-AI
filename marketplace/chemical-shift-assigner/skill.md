# Chemical Shift Assigner

Assign each peak to a functional group based on its chemical shift: consult shift tables and consider the molecular formula if known.

## Inputs

- `peak-list-nmr`: Picked peaks with chemical shifts
- `molecular-formula`: Known or proposed molecular formula, if available

## Outputs

- `shift-assignments`: Each peak assigned to a functional group or structural environment
- `degrees-of-unsaturation`: Calculated from the molecular formula, constraining possible structures

## Process

1. Compare each peak's chemical shift to standard correlation tables for 1H or 13C.
2. Assign probable functional groups: alkyl, aromatic, olefinic, carbonyl, heteroatom-attached.
3. If the molecular formula is known, calculate degrees of unsaturation (DBE).
4. Flag any peaks that fall in unexpected regions for the proposed structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
