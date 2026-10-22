# Structure Prediction Alphafold

Predict protein structure using AlphaFold2 or template-based homology modeling. AlphaFold2 uses the MSA and template information through an Evoformer network (48 blocks of MSA and pair representation updates) and Structure Module (8 recycling iterations) to predict 3D coordinates. For proteins with templates above 30% identity, classical homology modeling with template-based tools remains effective and faster. Evaluate predictions using pLDDT (per-residue confidence) and PAE (predicted aligned error for domain arrangement).

## Inputs

- `multiple-sequence-alignment`: Deep MSA from sequence analysis step
- `homolog-analysis`: Template structures and their alignments to query

## Outputs

- `predicted-structure`: 3D structure coordinates in PDB format with per-residue confidence scores
- `confidence-metrics`: pLDDT scores per residue, PAE matrix for inter-domain confidence, model ranking

## Process

1. If high-identity templates exist (>40% sequence identity, >80% coverage): run template-based homology modeling using the template alignment from HHsearch. Build 10-20 models with different random seeds. Evaluate models by DOPE score (lower is better) and GA341 assessment (>0.7 indicates native-like fold). Template-based spatial restraint satisfaction is fast (minutes) compared to AlphaFold2 (hours).
2. For AlphaFold2 prediction: run with full database search (colabfold_search + colabfold_batch for ColabFold, or the full pipeline for AlphaFold2). AlphaFold2 uses the MSA features (row and column attention in Evoformer), template features (if available), and pair representations to predict inter-residue distances and orientations.
3. AlphaFold2 generates 5 models (model_1 through model_5) with different random seeds and parameter sets. Rank models by predicted TM-score (pTM) or interface pTM (ipTM for multimers). The top-ranked model is not always the best; examine all 5.
4. Interpret pLDDT scores: >90 = very high confidence (backbone and side-chain reliable), 70-90 = confident (backbone reliable, side-chain placement approximate), 50-70 = low confidence (fold may be correct but details unreliable), <50 = disordered or very uncertain (often intrinsically disordered regions, do not interpret as structure).
5. Examine the PAE (Predicted Aligned Error) matrix for multi-domain proteins. Low PAE between two regions indicates their relative arrangement is predicted confidently. High PAE between domains means the domains are predicted independently and their relative orientation is uncertain (common for flexibly linked domains).
6. For protein complexes, use AlphaFold-Multimer. Provide sequences of all chains in a single FASTA. ipTM > 0.8 indicates a confident interface prediction. Examine the PAE matrix across chains for interface confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
