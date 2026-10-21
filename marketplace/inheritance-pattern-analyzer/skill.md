# Inheritance Pattern Analyzer

Analyze variant segregation across family members or a study cohort to determine inheritance patterns and penetrance.

## Inputs

- `annotated-variants`: Functionally annotated variant list from the annotation step
- `pedigree-data`: Family structure, affected status, and sample identifiers
- `phenotype-description`: Clinical or phenotypic description of the trait under investigation

## Outputs

- `segregation-report`: Variant co-segregation analysis with LOD scores or equivalent
- `inheritance-model`: Best-fit inheritance model (autosomal dominant, recessive, X-linked, de novo)
- `candidate-variants`: Final shortlist of candidate causal variants with supporting evidence

## Process

1. Map genotypes to pedigree positions and verify Mendelian consistency
2. Test each candidate variant under dominant, recessive, X-linked, and de novo models
3. Calculate LOD scores or Bayesian posterior probabilities for co-segregation
4. Cross-reference segregation results with functional annotation to prioritize candidates
5. Compile final candidate variant list with inheritance model, evidence strength, and next-step recommendations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
