# Functional Annotator

Annotate called variants with gene location, predicted protein impact, population frequency, and clinical significance.

## Inputs

- `filtered-variants`: High-confidence VCF from the variant calling step
- `annotation-databases`: Selected databases for annotation (ClinVar, gnomAD, dbSNP, COSMIC)
- `transcript-model`: Gene model source (RefSeq or Ensembl) for consequence prediction

## Outputs

- `annotated-variants`: Variants annotated with gene, consequence, protein change, and population frequency
- `pathogenicity-scores`: In-silico prediction scores (SIFT, PolyPhen, CADD) for each variant
- `clinical-hits`: Variants matching known pathogenic or likely pathogenic entries in clinical databases

## Process

1. Run VEP, SnpEff, or ANNOVAR to map each variant to its genomic context and predicted consequence
2. Cross-reference variants against population frequency databases to flag rare alleles
3. Apply in-silico pathogenicity predictors and aggregate scores
4. Match variants against ClinVar and disease-specific databases for known clinical significance
5. Produce a ranked report prioritizing variants by predicted functional impact

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
