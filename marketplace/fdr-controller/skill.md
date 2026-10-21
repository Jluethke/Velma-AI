# Fdr Controller

Control the false discovery rate: use target-decoy competition to set a score threshold that limits false identifications to the specified rate.

## Inputs

- `peptide-spectrum-matches`: PSMs from the database search including decoy hits
- `fdr-threshold`: Desired FDR level (typically 1% at PSM and protein levels)

## Outputs

- `validated-psms`: PSMs that pass the FDR threshold
- `protein-groups`: Proteins identified from validated peptides, grouped by shared evidence

## Process

1. Sort PSMs by score (best to worst).
2. Walk down the list, tracking the ratio of decoy hits to target hits (the estimated FDR).
3. Set the score threshold where the estimated FDR reaches the specified level.
4. Group validated peptides into protein groups using parsimony principles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
