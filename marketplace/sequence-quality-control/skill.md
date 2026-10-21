# Sequence Quality Control

Assess raw sequencing read quality, trim adapters and low-quality bases, and filter contamination.

## Inputs

- `raw-reads`: FASTQ files from the sequencing platform
- `sequencing-metadata`: Platform, library prep, read length, and expected coverage

## Outputs

- `trimmed-reads`: Adapter-trimmed, quality-filtered FASTQ files
- `qc-report`: FastQC and MultiQC summary of per-base quality, GC content, duplication, and adapter content

## Process

1. Run FastQC on raw reads and inspect per-base quality, adapter content, and overrepresented sequences
2. Trim adapters and low-quality tails with Trimmomatic, fastp, or cutadapt
3. Screen for contaminant sequences (host, PhiX, vectors) with Kraken2 or BBTools
4. Re-run FastQC on trimmed reads and compile MultiQC report

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
