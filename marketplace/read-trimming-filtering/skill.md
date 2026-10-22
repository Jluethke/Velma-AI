# Read Trimming Filtering

Remove adapter sequences and low-quality bases from raw reads. Use fastp for Illumina data: sliding window quality trimming (window size 4, quality threshold 20), adapter auto-detection, poly-G tail removal (NovaSeq two-color chemistry artifact), minimum length filter (36bp for short-insert, 50bp for standard), and per-read quality filter (mean Q below 15 discarded). For long reads, use Porechop for adapter removal or CCS for PacBio subread consensus.

## Inputs

- `raw-fastq-files`: FASTQ files to be trimmed
- `qc-report`: Quality report identifying specific issues to address

## Outputs

- `trimmed-fastq-files`: Cleaned FASTQ files with adapters removed and low-quality bases trimmed
- `trimming-statistics`: Read survival rate, base survival rate, adapter detection rate, quality-filtered count

## Process

1. For Illumina paired-end data, run fastp with adapter auto-detection enabled. Fastp identifies adapter sequences from overlap analysis of read pairs without requiring adapter sequence input.
2. Apply sliding window trimming: window size 4 bases, mean quality threshold Q20. Trim from 3-prime end when window average drops below threshold. Do not trim from 5-prime end unless quality flags indicated position-specific bias.
3. For NovaSeq and NextSeq data, enable poly-G tail removal. Two-color chemistry reports no-signal as G, creating poly-G artifacts at read ends.
4. Set minimum read length filter: 36bp for fragment libraries under 200bp insert, 50bp for standard 300-500bp insert libraries. Reads shorter than this after trimming contribute negligible mapping information.
5. Apply per-read quality filter: discard reads with mean quality below Q15. This removes the bottom tail of quality distribution without significant data loss in good libraries.
6. For UMI-containing libraries, extract UMI sequences before trimming. fastp supports UMI extraction from read headers or fixed positions in R1/R2.
7. Verify trimming results: read survival rate should exceed 95% for good libraries. Rates below 80% indicate upstream sample preparation issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
