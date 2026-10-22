# Clinical Variant Interpretation

Classify variants according to ACMG/AMP guidelines (5-tier system: pathogenic, likely pathogenic, variant of uncertain significance, likely benign, benign) using a structured evidence framework. Each evidence criterion (population frequency, computational predictions, functional data, segregation, de novo status) contributes weighted evidence toward pathogenicity or benignity. ClinGen expert panels provide gene-specific rule modifications.

## Inputs

- `annotated-variants`: Variants annotated with population frequency, computational predictions, and ClinVar status
- `clinical-phenotype`: Patient phenotype, family history, and inheritance pattern

## Outputs

- `classified-variants`: Each variant classified as P/LP/VUS/LB/B with evidence criteria applied
- `clinical-report-draft`: Structured report with variant table, interpretation, methodology, and limitations

## Process

1. Apply ACMG/AMP evidence criteria systematically for each variant. Population data: BA1 (allele frequency > 5% in any population, standalone benign), BS1 (frequency greater than expected for disorder), PM2 (absent or extremely low frequency in gnomAD: use the filtering allele frequency framework from Whiffin et al. to set gene-specific thresholds rather than a fixed cutoff).
2. Computational evidence: PP3 (multiple computational tools predict damaging: REVEL > 0.7, CADD > 25, SpliceAI > 0.5 for splice variants), BP4 (tools predict benign: REVEL < 0.15). Use REVEL as the primary missense predictor (outperforms individual tools). For splice variants, SpliceAI delta scores > 0.2 indicate potential splicing impact, > 0.5 is strong evidence.
3. Functional evidence: PS3 (well-established functional study shows damaging effect: protein stability, enzyme activity, transport, splicing assay), BS3 (functional study shows no damaging effect). Evaluate the assay: is it validated, does it measure the relevant protein function, is the effect size clinically meaningful? ClinGen Sequence Variant Interpretation working group provides functional assay evaluation criteria.
4. Segregation and de novo evidence: PS2 (de novo, confirmed by maternity and paternity testing: strong pathogenic), PM6 (assumed de novo without parental confirmation: moderate), PP1 (co-segregation with disease in multiple affected family members: supporting to strong depending on LOD score). For recessive conditions, PM3 (variant detected in trans with a known pathogenic variant).
5. Combine evidence following ACMG/AMP combining rules: pathogenic requires (PVS1 + >= 1 moderate) or (>= 2 strong) or (1 strong + >= 2 moderate/supporting) etc. Check ClinGen gene-specific recommendations that modify default criteria (e.g., specific functional domains where missense variants are pathogenic, adjusted PP3 thresholds).
6. Handle VUS appropriately: do not report VUS as causative. Provide a clear statement that VUS may be reclassified as more evidence becomes available. Recommend periodic reassessment. For clinical decision-making, VUS should not drive treatment changes but may inform surveillance decisions in context.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
