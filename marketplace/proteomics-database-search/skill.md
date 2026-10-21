# Proteomics Database Search

Search MS2 spectra against a protein sequence database to identify peptides and infer proteins.

## Inputs

- `imported-spectra`: Parsed MS2 spectra
- `protein-database`: FASTA file of target and decoy protein sequences

## Outputs

- `peptide-spectrum-matches`: All PSMs with scores and decoy labels
- `search-parameters`: Enzyme, mass tolerance, modifications, and other search settings

## Process

1. Configure the search engine with enzyme specificity, mass tolerance, and variable modifications.
2. Append a decoy database (reversed or shuffled sequences) for FDR estimation.
3. Run the search and score each peptide-spectrum match.
4. Record all PSMs with their scores, delta scores, and decoy flags.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
