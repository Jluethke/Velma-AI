# Documentation Gap Identifier

Identify missing or ambiguous documentation.

## Inputs

- `evidence-map`: Diagnosis-to-evidence mapping
- `unsupported-diagnoses`: Diagnoses needing clarification

## Outputs

- `gap-list`: List of missing elements with their location in the record
- `ambiguity-list`: Statements needing clarification from the provider

## Process

1. Scan for missing required sections (HPI, ROS, exam, assessment, plan).
2. Identify vague language that does not meet specificity requirements.
3. Note copy-forward errors and contradictions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
