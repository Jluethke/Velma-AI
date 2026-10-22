# Base Quality Recalibration

Recalibrate base quality scores to correct systematic errors in the sequencer's quality estimates. GATK BaseRecalibrator models quality score errors as a function of reported quality, read group, sequencing cycle, and dinucleotide context using a set of known variant sites (dbSNP, Mills indels, 1000 Genomes known indels) to distinguish true variants from errors. ApplyBQSR writes recalibrated scores. Skip for PCR-free WGS if downstream caller handles raw quality appropriately.

## Inputs

- `deduped-bam`: Duplicate-marked BAM file
- `reference-genome`: Reference genome FASTA matching the alignment reference
- `known-sites-vcf`: VCF files of known polymorphic sites (dbSNP, Mills, 1000G)

## Outputs

- `recalibrated-bam`: Analysis-ready BAM with corrected base quality scores
- `recalibration-report`: Before/after quality score comparison showing correction magnitude by covariate

## Process

1. Run GATK BaseRecalibrator: gatk BaseRecalibrator -I deduped.bam -R ref.fa --known-sites dbsnp.vcf --known-sites mills.vcf --known-sites 1000G.vcf -O recal_table. The tool counts mismatches at non-variant sites, grouped by covariates.
2. The covariates modeled by default are: reported quality score (QualityScoreCovariate), read group (ReadGroupCovariate), position in read/sequencing cycle (ContextCovariate for cycle), and preceding+current dinucleotide (ContextCovariate for context). These capture the main sources of systematic quality error.
3. Apply recalibration: gatk ApplyBQSR -I deduped.bam -R ref.fa --bqsr-recal-file recal_table -O recalibrated.bam. This writes new quality scores without modifying base calls.
4. Generate before/after plots with gatk AnalyzeCovariates to verify recalibration improved quality score accuracy. The empirical quality should align with reported quality after recalibration (points falling on diagonal).
5. For exome or targeted sequencing, use interval list (-L) to restrict recalibration to target regions plus padding. This speeds computation and avoids modeling off-target low-coverage regions.
6. The final output is the analysis-ready BAM suitable for variant calling, structural variant detection, or copy number analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
