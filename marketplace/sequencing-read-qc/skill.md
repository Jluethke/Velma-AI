# Sequencing Read Qc

Assess raw read quality and identify issues before alignment. Run FastQC on FASTQ files to evaluate per-base quality scores (Phred scale), sequence content bias, GC distribution, adapter contamination rate, duplication levels, and overrepresented sequences. Flag libraries with mean Q below 30, adapter content above 5%, or abnormal GC curves indicating contamination.

## Inputs

- `raw-fastq-files`: Paired-end or single-end FASTQ files from the sequencer
- `sequencing-platform`: Illumina, PacBio, or Oxford Nanopore with instrument model

## Outputs

- `qc-report`: Per-sample quality metrics including per-base quality distribution, adapter rates, and duplication levels
- `quality-flags`: Pass/warn/fail flags for each quality dimension with thresholds used

## Process

1. Run FastQC on each FASTQ file. For paired-end data, run on both R1 and R2 separately.
2. Examine per-base sequence quality: reads should maintain median Phred score above 28 through at least 80% of read length. Quality drop at 3-prime end is normal for Illumina; flag if drop begins before position 50.
3. Check adapter content curves. Illumina universal adapter and index sequences should be below 5% at any position. Higher rates indicate incomplete size selection or over-sequencing of short fragments.
4. Evaluate sequence duplication levels. For whole-genome at 30x target, expect 10-15% optical duplicates (patterned flow cells: HiSeq 4000, NovaSeq) or 5-8% PCR duplicates (unpatterned). PCR-free libraries should show minimal duplication. Exome and targeted panels tolerate higher duplication (30-40%) because of enrichment.
5. Check GC content distribution against the expected species profile. Bimodal or shifted GC curves indicate contamination from a different organism. Compare to reference GC distribution (human: ~41% mean GC).
6. For long-read platforms (PacBio HiFi, ONT), evaluate read length N50, quality score distribution (Q20+ fraction for HiFi should exceed 99%), and adapter-to-adapter success rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
