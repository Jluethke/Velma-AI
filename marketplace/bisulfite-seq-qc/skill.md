# Bisulfite Seq Qc

Quality-control bisulfite sequencing reads: adapter trimming, quality filtering, and bisulfite conversion rate assessment.

## Inputs

- `raw-sequencing-reads`: FASTQ files from bisulfite sequencing
- `sample-metadata`: Sample names, conditions, and expected conversion controls

## Outputs

- `trimmed-reads`: Quality-filtered and adapter-trimmed FASTQ files
- `qc-summary`: Read quality metrics and bisulfite conversion rate per sample

## Process

1. Run quality assessment on raw reads (per-base quality, adapter content, duplication rate).
2. Trim adapters and low-quality bases from read ends.
3. Estimate bisulfite conversion rate from spike-in controls or non-CpG methylation levels.
4. Flag samples with conversion rate below 99% for potential exclusion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
