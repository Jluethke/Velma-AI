# Regulatory Pathway And Study Design

Determine the regulatory pathway and design the clinical study: IDE determination, study type, endpoints, sample size, and statistical analysis plan.

## Inputs

- `device-classification`: FDA classification, predicate device (if 510(k)), or novel device rationale (De Novo or PMA)
- `clinical-evidence-requirements`: What clinical data FDA expects for the submission pathway, from pre-submission feedback or guidance documents

## Outputs

- `clinical-study-protocol`: Study design, endpoints, sample size, inclusion/exclusion criteria, and statistical analysis plan
- `ide-application`: IDE application (if significant risk) or abbreviated IDE documentation (if non-significant risk)

## Process

1. Determine if the study requires an IDE (Investigational Device Exemption). Significant risk devices (implants, life-sustaining, critical diagnostic) need FDA IDE approval before starting. Non-significant risk devices need IRB approval only. The sponsor makes the initial SR/NSR determination; FDA adjudicates if challenged.
2. Select the study design. Randomized controlled trial is the standard for PMA. For 510(k) with clinical data, a single-arm study with comparison to published literature or objective performance criteria (OPC) may suffice. Adaptive designs (with pre-specified interim analyses) can reduce enrollment if the effect is larger than expected.
3. Define primary endpoints: safety endpoint (adverse event rate, typically 6 or 12 months) and effectiveness endpoint (clinical outcome measure relevant to the intended use). The effectiveness endpoint must be clinically meaningful, not just a surrogate. Select validated instruments or outcome measures accepted in the therapeutic area.
4. Calculate sample size: specify the expected effect size, significance level (alpha, typically 0.05), power (typically 80% or 90%), and expected dropout rate. For superiority trials, the effect size is the minimum clinically important difference. For non-inferiority trials, specify the non-inferiority margin with clinical justification.
5. Write the statistical analysis plan before enrollment begins. Pre-specify the primary analysis population (ITT, per-protocol), the statistical test, handling of missing data, and the analysis of secondary endpoints. Pre-specification prevents post-hoc statistical fishing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
