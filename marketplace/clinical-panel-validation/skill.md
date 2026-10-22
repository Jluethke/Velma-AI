# Clinical Panel Validation

Design and validate a clinical sequencing panel for diagnostic use. Panel design specifies target genes, capture probes, and performance criteria. Validation establishes analytical sensitivity, specificity, reproducibility, and reportable range using reference materials (Genome in a Bottle, Horizon Discovery controls). Meeting CAP/CLIA requirements for laboratory-developed tests.

## Inputs

- `clinical-indication`: Disease area and gene list for the diagnostic panel
- `reference-materials`: Well-characterized samples with known variants for validation (NA12878/HG001, NA24385/HG002)

## Outputs

- `validated-panel-spec`: Panel design with target regions, expected coverage, and validated performance metrics
- `validation-report`: Analytical validation data: sensitivity, specificity, reproducibility, and limitations

## Process

1. Define target regions: gene list from clinical guidelines (e.g., NCCN for cancer predisposition, ACMG SF v3.2 for incidental findings). Include coding exons plus 20bp flanking intronic sequence (covers canonical splice sites). For known pathogenic deep intronic variants, add those specific positions. Total target size determines sequencing cost and required depth.
2. Select capture method: hybridization capture (Twist, IDT, Agilent) for panels > 50 genes or amplicon-based (QIAseq, AmpliSeq) for small focused panels (< 50 genes). Hybridization capture provides more uniform coverage and better CNV detection. Amplicon has lower input DNA requirements (10ng vs 200ng).
3. Define coverage requirements: minimum 250x mean coverage for germline, 500x for somatic (to detect low allele fractions). At least 95% of target bases must reach 20x (germline) or 100x (somatic). Regions consistently below threshold are excluded from the reportable range and listed as limitations.
4. Validate analytical performance: run at least 5 replicates of reference samples with known variants (Genome in a Bottle truth set for NA12878). Calculate sensitivity (true positives / (true positives + false negatives)) targeting >99% for SNVs, >95% for indels. Specificity (true negatives / (true negatives + false positives)) targeting >99.9%. Include intra-run and inter-run reproducibility.
5. Establish limit of detection for somatic panels: serial dilutions of a tumor cell line into normal DNA at 50%, 25%, 10%, 5%, 2.5% variant allele fractions. Determine the minimum allele fraction detected at 95% sensitivity for each variant type.
6. Document the validation in a format meeting CAP checklist requirements: test description, specimen types, analytical performance characteristics, reference range, reportable range, limitations (regions with insufficient coverage, variant types not detected), and validation study data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
