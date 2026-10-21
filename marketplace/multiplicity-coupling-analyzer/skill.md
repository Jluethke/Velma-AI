# Multiplicity Coupling Analyzer

Analyze the splitting pattern (multiplicity) and coupling constants of each resonance to determine neighboring proton environments.

## Inputs

- `peak-list-nmr`: Peaks with their multiplet groupings
- `shift-assignments`: Functional group assignments for context

## Outputs

- `multiplicity-table`: Each resonance with its multiplicity (s, d, t, q, m) and coupling constant(s) in Hz
- `connectivity-constraints`: Which proton environments are coupled to each other

## Process

1. Determine the multiplicity of each resonance by counting the lines in its multiplet.
2. Measure coupling constants (J values in Hz) from the line spacings.
3. Match reciprocal coupling constants to identify coupled pairs.
4. Use the n+1 rule to infer the number of neighboring protons for first-order patterns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
