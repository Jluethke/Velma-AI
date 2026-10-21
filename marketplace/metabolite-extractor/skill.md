# Metabolite Extractor

Extract metabolites from biological samples using the appropriate solvent system and sample preparation method.

## Inputs

- `biological-samples`: Tissue, plasma, urine, or cell pellet samples with metadata
- `extraction-protocol`: Solvent system and method (methanol-chloroform, acetonitrile, solid phase)

## Outputs

- `metabolite-extracts`: Prepared extracts ready for instrumental analysis
- `extraction-qc`: Recovery rates, blank results, and preparation batch information

## Process

1. Aliquot samples and add internal standards
2. Apply the extraction protocol (solvent addition, vortex, centrifuge, evaporate)
3. Reconstitute in the appropriate solvent for the analytical platform
4. Prepare pooled QC samples and blanks

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
