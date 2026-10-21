# Methylation Level Caller

Call methylation levels at individual CpG sites from aligned bisulfite reads.

## Inputs

- `aligned-reads`: Deduplicated BAM files
- `reference-genome`: Reference for CpG site identification

## Outputs

- `cpg-methylation-table`: Per-CpG methylation level (beta value) and coverage per sample
- `genome-wide-methylation-summary`: Overall methylation level distribution and CpG island vs open sea statistics

## Process

1. Extract methylation calls at each CpG site (count of methylated and unmethylated reads).
2. Compute beta values (methylated / total) and filter sites below minimum coverage threshold.
3. Summarize genome-wide methylation distribution and stratify by genomic context (CpG island, shore, shelf, open sea).
4. Generate a methylation density plot to visualize the bimodal distribution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
