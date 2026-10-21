# Database Searcher

Search processed spectra against a protein sequence database to identify peptides: match observed fragment ions to theoretical spectra.

## Inputs

- `processed-spectra`: Cleaned MS2 spectra
- `search-database`: Protein FASTA database with target and decoy sequences

## Outputs

- `peptide-spectrum-matches`: Each spectrum matched to a peptide sequence with a score
- `search-statistics`: Number of spectra searched, matched, and unmatched

## Process

1. Generate theoretical spectra for all peptides from the database within mass tolerance.
2. Score each observed spectrum against candidate peptides using a scoring function.
3. Retain the top-scoring match for each spectrum as a peptide-spectrum match (PSM).
4. Include decoy database hits for subsequent FDR estimation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
