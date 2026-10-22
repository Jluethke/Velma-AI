# Duplicate Marking

Identify and flag PCR and optical duplicate reads that arise from library amplification and sequencing artifacts. Use Picard MarkDuplicates or samtools markdup. For optical duplicates on patterned flow cells (HiSeq 4000, NovaSeq 6000), set OPTICAL_DUPLICATE_PIXEL_DISTANCE to 2500 (default 100 is for unpatterned). PCR-free libraries still require duplicate marking for optical duplicates.

## Inputs

- `aligned-bam`: Coordinate-sorted BAM file from alignment step
- `sequencing-platform`: Platform details needed to set optical duplicate distance

## Outputs

- `deduped-bam`: BAM file with duplicate reads flagged (FLAG 0x400) but retained
- `duplication-metrics`: Total reads, duplicate count, optical duplicate fraction, library complexity estimate

## Process

1. Run Picard MarkDuplicates on the coordinate-sorted BAM. Set REMOVE_DUPLICATES=false to flag rather than remove. Flagged duplicates are excluded by GATK tools automatically but remain available for manual inspection.
2. For patterned flow cells (NovaSeq, HiSeq 3000/4000), set OPTICAL_DUPLICATE_PIXEL_DISTANCE=2500. Optical duplicates arise from cluster generation, not PCR, and should be tracked separately. On unpatterned flow cells (HiSeq 2500, MiSeq), use the default distance of 100.
3. For UMI-tagged libraries, use UMI-aware deduplication (fgbio GroupReadsByUmi + CallMolecularConsensusReads, or Picard with BARCODE_TAG=RX). UMI deduplication collapses reads sharing both mapping position AND UMI sequence, allowing recovery of true biological duplicates that share a position by chance.
4. Evaluate duplication metrics: estimated library size indicates sequencing saturation. If estimated library size is less than 2x the number of unique reads desired, the library is over-sequenced and additional sequencing yields diminishing returns.
5. Check optical duplicate fraction specifically. Rates above 20% on NovaSeq suggest a flow cell loading issue (overloading). Rates should typically be 5-15% on patterned flow cells.
6. Create BAM index after duplicate marking: samtools index deduped.bam.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
