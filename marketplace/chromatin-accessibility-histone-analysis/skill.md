# Chromatin Accessibility Histone Analysis

Analyze chromatin accessibility (ATAC-seq) and histone modification (ChIP-seq, CUT&Tag) data. ATAC-seq uses Tn5 transposase to identify open chromatin regions. ChIP-seq and CUT&Tag profile histone marks (H3K4me3: active promoters, H3K27ac: active enhancers, H3K27me3: Polycomb repression, H3K36me3: active gene bodies). MACS2 calls peaks (enriched regions) against input/IgG control.

## Inputs

- `chromatin-bam`: Aligned BAM files from ATAC-seq, ChIP-seq, or CUT&Tag experiments
- `control-bam`: Input DNA or IgG control BAM for background normalization

## Outputs

- `peak-calls`: Genomic regions of enrichment (peaks) with signal intensity, fold enrichment, and statistical significance
- `chromatin-state-map`: Genome-wide chromatin state segmentation from combinatorial histone marks

## Process

1. For ATAC-seq preprocessing: shift reads to account for Tn5 insertion offset (+4bp on positive strand, -5bp on negative strand). Remove mitochondrial reads (typically 30-60% of ATAC-seq reads map to chrM). Filter for nucleosome-free fragments (insert size < 150bp) for open chromatin analysis, or mono-nucleosome fragments (180-247bp) for nucleosome positioning.
2. Call peaks with MACS2: macs2 callpeak -t treatment.bam -c control.bam -f BAMPE -g hs --nomodel (for ATAC-seq paired-end). For ChIP-seq: use --broad for histone marks with broad domains (H3K36me3, H3K27me3, H3K9me3) and narrow mode (default) for sharp marks (H3K4me3, H3K27ac, transcription factors). Set q-value threshold 0.01 (narrow) or 0.05 (broad).
3. For CUT&Tag data: use SEACR (Sparse Enrichment Analysis for CUT&Tag) instead of MACS2, as CUT&Tag has lower background and different noise characteristics. SEACR uses a data-driven threshold from IgG control or the signal distribution itself.
4. Assess peak reproducibility between replicates using IDR (Irreproducible Discovery Rate): idr --samples rep1_peaks.narrowPeak rep2_peaks.narrowPeak. IDR models the concordance between replicates. ENCODE standards: IDR < 0.05 threshold should recover >100,000 peaks for open chromatin, >20,000 peaks for most histone marks.
5. For chromatin state segmentation from multiple histone marks: run ChromHMM (chromHMM.jar LearnModel). ChromHMM trains a multivariate hidden Markov model where each state is defined by a combination of histone mark enrichments. Standard 15-state model resolves: active TSS, flanking TSS, active enhancers, bivalent enhancers, bivalent/poised TSS, repressed Polycomb, heterochromatin, and quiescent regions.
6. Perform differential peak analysis between conditions using DiffBind: establish a consensus peak set, count reads in peaks for all samples, and test for differential enrichment using DESeq2 (negative binomial) or edgeR. Normalize for library size and peak composition differences. Report differentially accessible/modified regions with fold change, p-value, and nearest gene annotation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
