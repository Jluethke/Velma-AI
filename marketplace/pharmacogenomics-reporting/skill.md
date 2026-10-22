# Pharmacogenomics Reporting

Genotype pharmacogenes, assign star alleles and metabolizer phenotypes, and report drug-gene interactions following CPIC (Clinical Pharmacogenetics Implementation Consortium) guidelines. Pharmacogenomics translates genetic variation in drug-metabolizing enzymes, transporters, and targets into actionable prescribing recommendations.

## Inputs

- `sequencing-data`: Targeted sequencing or WGS data covering pharmacogene regions
- `medication-list`: Patient's current and planned medications for interaction checking

## Outputs

- `pharmacogenomics-results`: Star allele calls, diplotypes, predicted phenotypes, and drug interaction table for each pharmacogene
- `prescribing-recommendations`: CPIC guideline-based dose adjustments or alternative drug recommendations

## Process

1. Call star alleles using Stargazer or PharmCAT for each pharmacogene. Star alleles represent defined haplotypes of functional variants (e.g., CYP2D6*4 is a splice-site variant causing no enzyme activity). Key genes: CYP2D6 (codeine, tamoxifen, many antidepressants), CYP2C19 (clopidogrel, proton pump inhibitors), CYP2C9 (warfarin, phenytoin), DPYD (fluoropyrimidines), TPMT/NUDT15 (thiopurines), UGT1A1 (irinotecan), SLCO1B1 (statins), HLA-B (abacavir, carbamazepine).
2. CYP2D6 requires special handling: the gene has common copy number variations (deletions: *5, duplications/multiplications: *1xN, *2xN) and hybrid alleles with CYP2D7 (e.g., *13, *36). Use read depth analysis for copy number and phasing information (or long reads) to resolve complex genotypes. An activity score system converts diplotype to phenotype: each allele gets a score (0, 0.25, 0.5, 1, or 1.5 per copy), and the sum determines metabolizer status.
3. Assign metabolizer phenotypes from diplotypes: poor metabolizer (PM: no functional alleles), intermediate metabolizer (IM: reduced function), normal metabolizer (NM: two functional alleles), rapid metabolizer (RM: increased function), ultrarapid metabolizer (UM: gene duplication of functional allele). Phenotype definitions are gene-specific and standardized by CPIC.
4. Map phenotypes to drug recommendations using CPIC guidelines. Example: CYP2D6 PM receiving codeine should avoid codeine (no conversion to morphine, lack of efficacy). CYP2C19 PM receiving clopidogrel should use alternative antiplatelet (prasugrel, ticagrelor) because clopidogrel is a prodrug requiring CYP2C19 activation. DPYD PM should avoid fluorouracil/capecitabine (risk of fatal toxicity).
5. For HLA-mediated adverse drug reactions: HLA-B*57:01 testing is required before abacavir (HIV treatment) to prevent hypersensitivity. HLA-B*15:02 testing before carbamazepine in Southeast Asian populations to prevent Stevens-Johnson syndrome. These are binary results (allele present/absent), not activity-score-based.
6. Generate the clinical report: list each tested pharmacogene with star allele result, diplotype, phenotype, associated medications, and CPIC recommendation level (A: prescribing action recommended, B: informational). Include the version of CPIC guidelines used, the genotyping/sequencing methodology, and limitations (variants not detected by the assay, genes not included in the panel).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
