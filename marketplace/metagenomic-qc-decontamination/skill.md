# Metagenomic Qc Decontamination

Quality-filter metagenomic reads and remove host contamination. Host removal is critical: human samples typically contain 10-90% host DNA depending on sample type (stool: 5-20%, saliva: 50-90%, tissue: 80-99%). Bowtie2 alignment against the host reference identifies and removes host reads before microbial analysis.

## Inputs

- `raw-metagenomic-fastq`: Raw shotgun metagenomic FASTQ files
- `host-reference`: Host genome reference for decontamination (e.g., GRCh38 for human)

## Outputs

- `decontaminated-fastq`: Host-removed, quality-filtered metagenomic reads
- `decontamination-metrics`: Input read count, host read fraction, surviving read count, quality distribution

## Process

1. Run fastp for adapter removal and quality trimming with the same parameters as genomic data: sliding window Q20, minimum length 50bp, poly-G removal for NovaSeq.
2. Remove host reads with Bowtie2: align against the host genome (bowtie2 -x host_index -1 R1.fq.gz -2 R2.fq.gz --very-sensitive --no-unal) and retain unmapped reads (samtools fastq -f 12). The --very-sensitive preset maximizes sensitivity for host detection at the cost of speed.
3. For additional decontamination, run against PhiX174 (Illumina spike-in control) and common laboratory contaminants (mycoplasma, E. coli lab strains). The KneadData pipeline wraps Bowtie2 host removal with Trimmomatic quality filtering.
4. Assess sequencing depth adequacy: for taxonomic profiling, 1-5 million reads per sample is often sufficient. For functional profiling and assembly, 10-50 million reads is standard. Use Nonpareil to estimate the fraction of the metagenome sampled (coverage) and predict how much additional sequencing would improve discovery.
5. Report host contamination rate per sample. Samples with >95% host reads may have insufficient microbial data for reliable profiling. Consider alternative wet-lab approaches (differential lysis, propidium monoazide treatment) for high-host samples.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
