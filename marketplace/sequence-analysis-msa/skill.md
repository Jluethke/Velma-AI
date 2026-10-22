# Sequence Analysis Msa

Analyze protein sequence for homologs and build multiple sequence alignment. PSI-BLAST iteratively searches UniRef90/UniProt for homologous sequences using position-specific scoring matrices. HHblits performs HMM-HMM comparison against UniClust30 for more sensitive remote homology detection. The resulting MSA captures evolutionary conservation patterns that inform structure prediction. MUSCLE and MAFFT produce high-quality alignments for downstream modeling.

## Inputs

- `query-protein-sequence`: Target protein sequence in FASTA format
- `sequence-databases`: UniRef90, UniClust30, PDB70 databases for homology search

## Outputs

- `multiple-sequence-alignment`: MSA of query and homologous sequences in A3M or Stockholm format
- `homolog-analysis`: Template hits with sequence identity, coverage, E-value, and structural information

## Process

1. Run PSI-BLAST against UniRef90 for 3 iterations with E-value threshold 1e-3. Each iteration builds a position-specific scoring matrix (PSSM) from significant hits, increasing sensitivity for remote homologs. Collect sequences with >30% identity over >70% coverage for homology modeling; sequences at 20-30% identity for MSA depth.
2. Run HHblits against UniClust30 for 3 iterations. HHblits compares HMM profiles (not just sequences), detecting homologs down to 10-15% sequence identity. The a3m output format preserves insertions relative to the query.
3. Search PDB70 (clustered PDB database) with HHsearch to identify structural templates. Evaluate templates by: probability (>70% indicates reliable homology), sequence identity, coverage, and resolution of the crystal structure. Multiple templates covering different domains may be needed for multi-domain proteins.
4. Build the final MSA from merged PSI-BLAST and HHblits hits. Remove sequences with >90% identity to reduce redundancy, sequences with <30% coverage to avoid alignment artifacts, and sequences with excessive gaps (>50% gap positions).
5. Align the filtered sequence set with MAFFT using the L-INS-i strategy (most accurate for sequences with one alignable domain) or E-INS-i (for sequences with multiple conserved blocks separated by variable regions). For very large alignments (>10,000 sequences), use MAFFT --auto for speed.
6. Evaluate MSA quality: effective number of sequences (Neff, calculated by down-weighting similar sequences at 80% identity) should exceed 100 for reliable coevolution analysis. Low Neff indicates insufficient evolutionary information for contact prediction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
