# Functional Potential Predictor

Predict the functional potential of the microbial community from taxonomy or assembled genes.

## Inputs

- `taxonomy-table`: OTU/ASV table (for marker gene studies)
- `filtered-reads`: Quality-filtered reads (for shotgun studies)

## Outputs

- `pathway-abundance-table`: Predicted metabolic pathway abundances per sample
- `functional-summary`: Key functional categories and their differential presence across groups

## Process

1. For marker gene data, run PICRUSt2 or Tax4Fun to infer gene content from taxonomy
2. For shotgun data, run HUMAnN3 to quantify pathway abundances directly from reads
3. Map gene families to metabolic pathways (MetaCyc, KEGG)
4. Summarize the functional profile and identify differentially abundant pathways

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
