# Biomarker Clinical Question Definer

Define the clinical question the biomarker is intended to answer, including the target condition, intended use, and clinical context.

## Inputs

- `candidate-biomarker`: The biomarker under evaluation (analyte, gene, imaging feature)
- `clinical-context`: The disease, population, and clinical decision the biomarker would inform

## Outputs

- `clinical-question`: Structured clinical question (screening, diagnosis, prognosis, or monitoring)
- `performance-targets`: Minimum acceptable sensitivity, specificity, and PPV for clinical utility

## Process

1. Classify the intended use as screening, diagnosis, prognosis, or treatment monitoring
2. Define the target condition and the reference standard for case ascertainment
3. Set the minimum performance targets based on clinical consequence of false positives and negatives
4. Document the clinical question in structured format

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
