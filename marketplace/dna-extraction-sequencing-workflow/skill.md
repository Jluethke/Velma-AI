# Dna Extraction Sequencing Workflow

Extract DNA from field specimens, amplify target markers (COI, rbcL, ITS), prepare sequencing libraries, and run quality control on returned sequences.

## Inputs

- `collection-protocol`: Specimens available and preservation method used
- `taxa-of-interest`: Which markers to target per taxon

## Outputs

- `sequence-dataset`: Cleaned, trimmed sequences with specimen IDs and metadata
- `qc-report`: Read quality, alignment success rate, and contamination flags
- `marker-coverage-summary`: Which specimens yielded usable sequence for each marker

## Process

1. Extract DNA using a protocol matched to tissue type and preservative
2. Amplify target barcoding markers with appropriate primers
3. Prepare sequencing libraries and submit to sequencing facility
4. Trim, quality-filter, and align returned sequences
5. Flag contamination and low-quality reads

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
