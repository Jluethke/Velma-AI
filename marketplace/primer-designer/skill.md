# Primer Designer

Design PCR primers for a target gene region, checking melting temperature, GC content, secondary structure, and specificity.

## Inputs

- `target-gene`: Gene name or genomic coordinates of the region of interest
- `reference-sequence`: FASTA sequence or accession number for the reference genome
- `amplicon-size-range`: Desired product size in base pairs (e.g. 200-500 bp)

## Outputs

- `primer-pairs`: Forward and reverse primer sequences with Tm, GC%, and predicted amplicon size
- `specificity-report`: BLAST results confirming primer specificity against the reference genome
- `secondary-structure-check`: Hairpin, self-dimer, and hetero-dimer scores for each primer pair

## Process

1. Retrieve the target region from the reference sequence using coordinates or gene name
2. Generate candidate primer pairs using thermodynamic criteria (Tm 58-62C, GC 40-60%, length 18-25 nt)
3. Screen for secondary structures (hairpins, dimers) and discard candidates above threshold
4. Run in-silico BLAST against the reference to confirm single-target amplification
5. Rank primer pairs by combined score and return the top three candidates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
