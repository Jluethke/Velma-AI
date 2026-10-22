# Variant Annotation Filtering

Annotate variants with functional consequence, population frequency, pathogenicity predictions, and clinical significance. VEP (Ensembl Variant Effect Predictor) assigns consequence terms from the Sequence Ontology, predicts protein impact, and adds allele frequencies from gnomAD. ANNOVAR provides alternative annotation with refGene, cytoBand, and multiple prediction databases. Filter variants using GATK VQSR (machine learning on truth sets) or hard filters as fallback.

## Inputs

- `raw-germline-vcf`: Raw variant calls to annotate and filter
- `somatic-vcf`: Somatic variant calls to annotate (optional)

## Outputs

- `annotated-vcf`: VCF with functional annotations, population frequencies, pathogenicity scores, and clinical significance
- `filtered-variants`: High-confidence variant set after quality filtering with PASS/filter status

## Process

1. Run VEP with cache mode for speed: vep --cache --dir_cache vep_data --assembly GRCh38 --offline --fasta ref.fa --input_file variants.vcf --output_file annotated.vcf --vcf --everything. The --everything flag adds all available annotations including SIFT, PolyPhen, allele frequencies, and regulatory features.
2. Key annotation fields to evaluate: IMPACT (HIGH/MODERATE/LOW/MODIFIER from Sequence Ontology consequence), gnomAD_AF (population allele frequency; rare disease threshold typically AF < 0.01 or 0.001), SIFT (tolerated/deleterious with score), PolyPhen (benign/possibly_damaging/probably_damaging with score), CADD (Combined Annotation Dependent Depletion; phred-scaled score >20 indicates top 1% deleterious), ClinVar (pathogenic/benign/VUS classification with review status).
3. For GATK VQSR filtering (requires at least 30 exomes or 1 WGS): build recalibration model using truth sets (HapMap, Omni, 1000G, dbSNP) with gatk VariantRecalibrator. Apply tranches with ApplyVQSR at sensitivity threshold (99.5% for SNPs, 99.0% for indels).
4. If sample count is insufficient for VQSR, apply hard filters: SNPs (QD < 2.0, FS > 60.0, MQ < 40.0, MQRankSum < -12.5, ReadPosRankSum < -8.0); Indels (QD < 2.0, FS > 200.0, ReadPosRankSum < -20.0). These thresholds are from GATK best practices and work for most Illumina data.
5. For clinical reporting, prioritize variants by: (1) ClinVar pathogenic/likely pathogenic, (2) predicted loss-of-function in disease-associated genes, (3) rare missense with high CADD (>25) in phenotype-relevant genes, (4) splice-region variants within 2bp of exon boundary.
6. Generate summary statistics: total variants by consequence class, novel variant rate (not in dbSNP), Ti/Tv ratio in filtered set (should remain near 2.0 for WGS).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
