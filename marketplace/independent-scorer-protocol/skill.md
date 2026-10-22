# Independent Scorer Protocol

Strip candidate identity from every submission before scoring, and have each scorer rate independently before any discussion. Anonymizing removes the halo of a strong resume or a familiar name.

## Inputs

- `scoring-rubric`: The weighted rubric with anchors
- `scorer-guide`: How to apply the rubric

## Outputs

- `blinding-steps`: The step-by-step process a non-scoring coordinator uses to strip identity and assign random codes
- `inter-rater-resolution`: How scorers resolve disagreements of more than one point on a dimension through discussion and re-scoring

## Process

1. A coordinator who does not score removes names, contact details, and identifying metadata from each submission and assigns a random four-digit code.
2. Each scorer rates all anonymized submissions alone, using the rubric, with no discussion until every score is in.
3. Where two scorers differ by more than one point on any dimension, they discuss that dimension and re-score. The aim is calibration, not forced agreement.
4. Record final scores by code, and reveal identities only after scoring is complete.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
