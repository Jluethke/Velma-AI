# Paleo Taxonomic Identification

Identify prepared fossil specimens to the lowest possible taxonomic level using morphological comparison and published keys.

## Inputs

- `prepared-specimens`: Catalog of prepared specimens with photographs
- `target-taxa`: Expected taxonomic groups based on formation and age

## Outputs

- `taxonomic-assignments`: Each specimen assigned to order, family, genus, and species where possible
- `diagnostic-characters`: Key morphological features supporting each identification
- `unresolved-specimens`: Specimens requiring further comparison or CT scanning

## Process

1. Compare each specimen against published type descriptions and figured material
2. Score diagnostic morphological characters using a standardized character matrix
3. Flag specimens that fall outside known variation for the assigned taxon
4. Record confidence level (definite, probable, cf., aff.) for each assignment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
