# Proteomics Fdr Filter

Filter peptide and protein identifications to a target false discovery rate using the target-decoy approach.

## Inputs

- `peptide-spectrum-matches`: All PSMs with scores and decoy labels
- `fdr-threshold`: Target FDR (typically 0.01 at peptide and protein level)

## Outputs

- `filtered-peptides`: Peptides passing the FDR threshold
- `protein-groups`: Inferred protein groups with parsimony applied

## Process

1. Sort PSMs by score and compute the FDR at each score threshold using target-decoy counting.
2. Apply the peptide-level FDR cutoff.
3. Infer protein groups using the principle of parsimony (Occam's razor).
4. Apply protein-level FDR filtering.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
