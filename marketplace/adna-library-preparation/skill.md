# Adna Library Preparation

Prepare sequencing libraries from the aDNA extract using damage-aware protocols that preserve the short, degraded fragments.

## Inputs

- `dna-extract`: Purified ancient DNA extract
- `library-protocol`: Single-stranded or double-stranded library protocol with UDG treatment option

## Outputs

- `sequencing-library`: Indexed sequencing library ready for capture or shotgun sequencing
- `library-metrics`: Molecule count, complexity estimate, and fragment length distribution

## Process

1. Perform end repair and adapter ligation using a protocol suited to short fragments
2. Add unique dual indexes for downstream demultiplexing and contamination tracking
3. Amplify with minimal PCR cycles to preserve library complexity
4. QC the library on a fragment analyzer to verify the size distribution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
