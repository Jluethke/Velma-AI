# Dna Methylation Analysis

Analyze whole-genome bisulfite sequencing (WGBS) or reduced-representation bisulfite sequencing (RRBS) data. Bismark aligns bisulfite-converted reads to an in-silico converted reference genome, then extracts per-CpG methylation levels. Differential methylation analysis identifies regions with statistically significant methylation differences between conditions using DSS (beta-binomial model) or methylKit.

## Inputs

- `bisulfite-fastq`: Bisulfite-converted sequencing reads (WGBS or RRBS)
- `reference-genome`: Reference genome FASTA for bisulfite alignment

## Outputs

- `methylation-calls`: Per-CpG methylation levels (beta values) with coverage depth across the genome
- `differential-methylation`: Differentially methylated regions (DMRs) with effect size, p-value, and gene annotations

## Process

1. Prepare bisulfite genome with Bismark: bismark_genome_preparation --bowtie2 genome_folder/. This creates C-to-T and G-to-A converted versions of the reference for alignment of bisulfite-converted reads from both strands.
2. Align with Bismark: bismark --bowtie2 --genome genome_folder/ -1 R1.fq.gz -2 R2.fq.gz. Bismark handles the four possible alignment scenarios (original top/bottom strand, complementary top/bottom strand) and reports the uniquely mapping strand. Typical mapping rates: 60-80% for WGBS (lower than genomic because bisulfite conversion reduces sequence complexity).
3. Deduplicate: deduplicate_bismark aligned.bam. Bisulfite libraries amplified by PCR require deduplication. PCR-free WGBS protocols skip this step.
4. Extract methylation: bismark_methylation_extractor --comprehensive --bedGraph --cytosine_report --genome_folder genome_folder/ aligned.bam. Output includes per-CpG methylation level (methylated reads / total reads), coverage depth, and strand information. Filter CpGs with coverage < 5x for statistical reliability.
5. Identify DMRs with DSS: DMLtest for pairwise comparison, callDMR for region calling. DSS models methylation as beta-binomial (accounts for both biological and sampling variability) and uses a Wald test. DMR criteria: minimum 3 CpGs, minimum length 50bp, minimum absolute methylation difference 0.1 (10%), smoothing window for spatial correlation.
6. Annotate DMRs: map to genomic features (promoter: -2kb to +500bp from TSS, gene body, intergenic, CpG island/shore/shelf). Hypermethylation of CpG island promoters typically correlates with gene silencing. Gene body methylation often correlates with active transcription. Integrate with expression data to identify functional methylation changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
