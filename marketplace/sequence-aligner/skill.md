# Sequence Aligner

Align a set of homologous sequences using a multiple sequence alignment algorithm, then trim poorly aligned regions.

## Inputs

- `raw-sequences`: FASTA file or sequence set to align
- `alignment-method`: Algorithm choice (MUSCLE, MAFFT, ClustalW, or T-Coffee)
- `trimming-threshold`: Gap fraction above which columns are removed

## Outputs

- `aligned-sequences`: Trimmed multiple sequence alignment
- `alignment-statistics`: Column count, gap fraction, conserved sites, informative sites

## Process

1. Run the chosen alignment algorithm on the raw sequences.
2. Score each alignment column for gap fraction and conservation.
3. Trim columns exceeding the gap threshold.
4. Report alignment length, informative site count, and average pairwise identity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
