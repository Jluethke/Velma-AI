# Read Alignment Mapping

Align trimmed reads to a reference genome or transcriptome and generate sorted, deduplicated BAM files.

## Inputs

- `trimmed-reads`: Quality-filtered FASTQ files
- `reference-genome`: Reference genome or transcriptome FASTA with index

## Outputs

- `aligned-bam`: Sorted, indexed, deduplicated BAM files per sample
- `alignment-stats`: Mapping rate, duplication rate, insert size, and coverage per sample

## Process

1. Index the reference genome if not already indexed
2. Align reads with BWA-MEM2 (DNA) or STAR/HISAT2 (RNA) using default or tuned parameters
3. Sort by coordinate, mark duplicates with Picard or samblaster, and index the BAM
4. Collect alignment statistics with samtools stats and Picard CollectInsertSizeMetrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
