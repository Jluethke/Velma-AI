# Dna Sequencing Runner

Prepare samples for Sanger or next-generation sequencing, submit to a sequencing facility, and retrieve raw data files.

## Inputs

- `purified-product`: Gel-purified or column-cleaned PCR product with concentration measurement
- `sequencing-method`: Sanger, Illumina, Nanopore, or other platform selection
- `coverage-target`: Desired sequencing depth or number of reads

## Outputs

- `raw-sequence-data`: FASTQ or AB1 files from the sequencing run
- `quality-scores`: Per-base quality scores and overall run quality metrics
- `sequence-summary`: Read count, average length, Q30 percentage, and error rate

## Process

1. Quantify purified DNA using fluorometric or spectrophotometric measurement
2. Prepare sequencing library per platform protocol (Sanger: premix with primer; NGS: adapter ligation)
3. Submit samples to the sequencing facility with required metadata and sample sheet
4. Download raw data files and verify file integrity with checksums
5. Generate initial quality metrics using FastQC or equivalent and flag any low-quality runs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
