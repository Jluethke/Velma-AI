# Independent Coding Runner

Run the independent coding round: each rater codes the same dataset without consulting the others.

## Inputs

- `codebook-draft`: The codebook raters are using
- `reliability-dataset`: The dataset to be coded for the reliability assessment

## Outputs

- `rater-code-matrix`: Each rater's codes for each unit of analysis
- `coding-process-notes`: Any difficulties raters noted during independent coding

## Process

1. Distribute the reliability dataset to each rater with blinding (no access to others' codes).
2. Each rater codes every unit independently using the codebook.
3. Collect all codes into a single matrix (units by raters).
4. Collect process notes on any units raters found difficult.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
