# Concept Matrix Builder

Build a concept matrix: rows are papers, columns are key concepts, cells indicate whether each paper addresses each concept and with what finding.

## Inputs

- `paper-corpus`: Collected papers with metadata
- `research-question`: The question or topic to map

## Outputs

- `concept-matrix`: Papers-by-concepts matrix with findings in each cell
- `concept-list`: The list of key concepts extracted from the corpus

## Process

1. Read each paper and extract the key concepts it addresses.
2. Consolidate concepts into a unified list, merging synonyms.
3. For each paper-concept pair, record the finding (supports, contradicts, partial, absent).
4. Produce the matrix as a structured table.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
