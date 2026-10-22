# Germline Variant Calling

Call germline SNVs and indels from a single sample or joint-called cohort. GATK HaplotypeCaller operates in three phases: active region detection (identify areas with evidence of variation), local assembly (de Bruijn graph of reads in active region), and genotyping (pair-HMM likelihood calculation for each haplotype). For single samples, use GVCF mode (-ERC GVCF) to enable later joint genotyping. DeepVariant provides a CNN-based alternative that often outperforms HaplotypeCaller on Illumina data.

## Inputs

- `recalibrated-bam`: Analysis-ready BAM file from the sequencing pipeline
- `reference-genome`: Reference FASTA matching the BAM alignment

## Outputs

- `raw-germline-vcf`: VCF with all called variant sites and genotype likelihoods
- `calling-metrics`: Total variants called, Ti/Tv ratio, het/hom ratio, indel length distribution

## Process

1. For single-sample calling with later cohort analysis, run HaplotypeCaller in GVCF mode: gatk HaplotypeCaller -R ref.fa -I sample.bam -ERC GVCF -O sample.g.vcf. GVCF includes non-variant blocks with reference confidence, enabling joint genotyping across samples without re-processing BAMs.
2. For joint genotyping of a cohort, consolidate GVCFs with GenomicsDBImport (scales better than CombineGVCFs for large cohorts), then run GenotypeGVCFs on the database.
3. As an alternative, run Google DeepVariant: the CNN evaluates pileup images of each candidate site. DeepVariant consistently wins PrecisionFDA Truth Challenges for Illumina data. Use the WGS or WES model as appropriate.
4. For long-read data, use DeepVariant with the PACBIO or ONT model, or PEPPER-Margin-DeepVariant pipeline that handles alignment uncertainty in long reads.
5. Evaluate call set quality: whole-genome Ti/Tv ratio should be approximately 2.0-2.1 (exome: 2.8-3.3). Het/hom ratio approximately 1.5 for outbred populations. Significant deviation indicates systematic error.
6. Expect approximately 4.0-4.5 million SNVs and 500-600K indels per human genome at 30x WGS coverage against GRCh38.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
