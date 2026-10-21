# Species Abundance Tabulator

Organize raw species observation data into a site-by-species abundance matrix.

## Inputs

- `observation-records`: Raw species observation data with site, species, and count
- `taxonomic-key`: Accepted species names and synonymy table for standardization

## Outputs

- `abundance-matrix`: Sites as rows, species as columns, counts as values
- `sampling-effort`: Number of samples, area surveyed, or time spent per site

## Process

1. Standardize species names using the taxonomic key to resolve synonyms and misspellings
2. Aggregate counts by site and species, resolving duplicate entries
3. Build the site-by-species abundance matrix
4. Record sampling effort per site for rarefaction normalization

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
