# Variant Caller

Align sequencing reads to a reference genome and call genetic variants (SNPs, indels, structural variants) with quality filtering.

## Inputs

- `raw-sequence-data`: FASTQ files from the sequencing step
- `reference-sequence`: Reference genome FASTA for read alignment
- `quality-thresholds`: Minimum mapping quality, base quality, and coverage depth filters

## Outputs

- `variant-calls`: VCF file of called variants with quality scores and genotype information
- `alignment-stats`: Mapping rate, coverage depth distribution, and duplicate rate
- `filtered-variants`: High-confidence variant set after quality filtering

## Process

1. Trim adapters and low-quality bases from raw reads using a quality trimmer
2. Align trimmed reads to the reference genome with BWA-MEM or equivalent aligner
3. Mark duplicates and recalibrate base quality scores
4. Call variants using GATK HaplotypeCaller, FreeBayes, or the appropriate caller for the platform
5. Apply hard or VQSR filtering to produce a high-confidence variant set

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
