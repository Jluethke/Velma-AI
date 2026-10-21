# Metagenomic Read Qc

Quality-filter metagenomic reads by trimming adapters, removing low-quality bases, and filtering host contamination.

## Inputs

- `raw-reads`: FASTQ files from the sequencing run
- `host-reference`: Host genome for contamination removal (if applicable)

## Outputs

- `filtered-reads`: Quality-filtered FASTQ files ready for analysis
- `qc-report`: Summary of read counts, quality scores, and filtering statistics

## Process

1. Run adapter trimming and quality filtering (Trimmomatic, fastp, or equivalent)
2. Remove host-derived reads by mapping against the host reference genome
3. Generate quality metrics before and after filtering
4. Produce the QC report with pass/fail thresholds

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
