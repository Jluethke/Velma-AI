# Variant Or Expression Calling

Call variants (DNA) or quantify differential expression (RNA) depending on the experiment type.

## Inputs

- `aligned-bam`: Sorted, deduplicated BAM files per sample
- `experiment-design`: Sample groups, contrasts, and analysis type (variant calling or DGE)

## Outputs

- `call-results`: VCF of called variants (DNA) or table of differentially expressed genes with fold change and adjusted p-value (RNA)
- `call-qc`: Ti/Tv ratio, variant type distribution (DNA) or dispersion estimates, MA plot (RNA)

## Process

1. For DNA: call variants with GATK HaplotypeCaller or DeepVariant, filter with VQSR or hard filters
2. For RNA: quantify gene counts with featureCounts or Salmon, run DESeq2 or edgeR for differential expression
3. Apply multiple testing correction (Benjamini-Hochberg) and set significance thresholds
4. Generate QC plots: Ti/Tv and variant summary (DNA) or MA plot and dispersion (RNA)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
