# Structural Variant Detection

Detect structural variants (deletions, duplications, inversions, translocations) and copy number alterations. SV callers use multiple evidence types: split reads (SA tag), discordant read pairs (abnormal insert size or orientation), read depth changes, and assembly. Manta is the primary caller for Illumina data (split-read and paired-end evidence); DELLY adds B-allele frequency for genotyping. For CNV, CNVkit uses on-target and off-target coverage in exome data or uniform binning in WGS.

## Inputs

- `recalibrated-bam`: Analysis-ready BAM (tumor and/or normal)
- `reference-genome`: Reference FASTA

## Outputs

- `sv-vcf`: VCF of structural variants with event type, size, breakpoint coordinates, and supporting evidence count
- `cnv-segments`: Segmented copy number profile with log2 ratio and estimated integer copy number

## Process

1. Run Manta for SV detection: configManta.py followed by runWorkflow.py. Manta performs local assembly at breakpoint candidates identified from anomalous read pairs and split reads. It outputs diploidSV.vcf.gz (germline) and somaticSV.vcf.gz (if tumor-normal pair provided).
2. Run DELLY for complementary SV detection: delly call -g ref.fa -o sv.bcf sample.bam. DELLY uses paired-end mapping, split-read alignment, and read depth to call deletions, duplications, inversions, and translocations. Merge calls from Manta and DELLY using SURVIVOR (minimum 2 callers agreeing within 500bp breakpoint distance).
3. For copy number, run CNVkit: cnvkit.py batch tumor.bam --normal normal.bam --targets targets.bed --fasta ref.fa. CNVkit uses both on-target and off-target (antitarget) bins for exome data, improving resolution in gene-sparse regions. For WGS, use cnvkit.py batch with --method wgs.
4. Segment the CNV profile: cnvkit.py segment sample.cnr -o sample.cns. Circular binary segmentation (CBS) identifies breakpoints in the log2 ratio profile. The segmented output provides region-level copy number calls.
5. Call integer copy number states: cnvkit.py call sample.cns --purity 0.7 --ploidy 2. Purity and ploidy are estimated from the B-allele frequency and log2 ratio distribution or provided from external tools (ASCAT, PureCN, Sequenza).
6. Annotate SVs with gene overlap and known fusion partners. Filter by population frequency (gnomAD-SV for germline) and supporting evidence count (minimum 3 split reads or 5 discordant pairs for high-confidence calls).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
