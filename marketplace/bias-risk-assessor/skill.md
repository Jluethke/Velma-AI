# Bias Risk Assessor

Assess risk of bias in each included study using a domain-appropriate tool (Cochrane RoB, ROBINS-I, Newcastle-Ottawa, or similar).

## Inputs

- `extraction-table`: extracted data per study
- `review-scope`: study design types determining which bias tool to use

## Outputs

- `bias-assessment-table`: per-study risk ratings across bias domains
- `overall-bias-summary`: summary of bias patterns across the evidence base

## Process

1. Select the appropriate bias assessment tool for each study design
2. Rate each bias domain (selection, performance, detection, attrition, reporting) per study
3. Produce a traffic-light summary figure across all studies and domains
4. Identify studies at high risk and note implications for the synthesis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
