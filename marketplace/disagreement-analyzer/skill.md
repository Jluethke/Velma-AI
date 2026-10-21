# Disagreement Analyzer

Identify patterns in disagreements: which codes are most confused, which raters diverge most, and which data characteristics predict disagreement.

## Inputs

- `rater-code-matrix`: Raters' codes for each unit
- `agreement-coefficient`: Overall reliability statistic

## Outputs

- `confusion-matrix`: Which codes are confused with which, and how often
- `disagreement-patterns`: Systematic patterns in where and why raters disagree

## Process

1. Build a confusion matrix across all rater pairs.
2. Identify the most commonly confused code pairs.
3. Check whether disagreements cluster on specific data characteristics (length, complexity, topic).
4. Check whether specific raters are outliers in disagreement rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
