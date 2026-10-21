# Bisulfite Alignment

Align bisulfite-converted reads to a reference genome using a bisulfite-aware aligner.

## Inputs

- `trimmed-reads`: QC-passed reads
- `reference-genome`: Reference genome build for alignment

## Outputs

- `aligned-reads`: BAM files with aligned bisulfite reads
- `alignment-statistics`: Mapping rate, duplication rate, coverage per sample

## Process

1. Align using a bisulfite-aware aligner (Bismark, bwa-meth, or BSMAP).
2. Remove PCR duplicates based on alignment position.
3. Compute alignment statistics: mapping rate, insert size distribution, genome coverage.
4. Verify that coverage is sufficient for the analysis (typically 10x or higher for single-CpG resolution).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
