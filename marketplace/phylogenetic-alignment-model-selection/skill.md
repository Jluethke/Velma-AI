# Phylogenetic Alignment Model Selection

Prepare sequence alignments for phylogenetic inference and select the best-fitting substitution model. Alignment quality directly determines tree accuracy. trimAl and Gblocks remove poorly aligned regions that introduce noise. ModelTest-NG evaluates substitution models (JC, HKY, GTR for DNA; JTT, WAG, LG for protein) with rate variation (+G gamma, +I invariant sites) using AIC and BIC.

## Inputs

- `homologous-sequences`: Set of orthologous sequences in FASTA format
- `sequence-type`: DNA or protein, coding or non-coding

## Outputs

- `curated-alignment`: Trimmed multiple sequence alignment in PHYLIP or FASTA format
- `substitution-model`: Best-fit model with parameters (base frequencies, rate matrix, gamma shape, invariant proportion)

## Process

1. Align sequences with MAFFT: for protein, use the L-INS-i algorithm (--localpair --maxiterate 1000) for best accuracy up to approximately 200 sequences. For DNA coding regions, align as codons: translate to protein, align protein sequences, then back-translate to DNA preserving codon structure (TranslatorX or PAL2NAL).
2. Trim unreliable alignment columns with trimAl -automated1 (selects the best trimming strategy automatically) or Gblocks with relaxed parameters (b4=5, b5=h for allowing half gaps). Examine trimmed alignment: if more than 50% of columns are removed, the sequences may be too divergent for reliable phylogenetic inference.
3. Run ModelTest-NG: modeltest-ng -i alignment.phy -d nt (nucleotide) or -d aa (amino acid). ModelTest-NG evaluates substitution models by fitting parameters via maximum likelihood and comparing models using AIC (penalizes complexity less) and BIC (penalizes complexity more). For most datasets, BIC is preferred as it selects simpler models that generalize better.
4. For DNA: common best-fit models are GTR+G (general time reversible with gamma-distributed rate variation, 6 rate parameters + 4 frequencies + alpha shape) or HKY+G (2 rate parameters: transition/transversion ratio). For protein: LG+G (Le and Gascuel 2008) or WAG+G are typical winners.
5. If the dataset has many invariant sites (conserved positions), models with +I (proportion invariant) improve fit. However, +G+I together can be poorly identifiable (both model rate variation). In practice, GTR+G4 (4 gamma categories) is sufficient for most analyses.
6. Record the model selection result: tree inference tools (RAxML-NG, IQ-TREE, MrBayes) accept the model specification directly. Misspecified models cause biased branch lengths and can distort tree topology, particularly at deep divergences.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
