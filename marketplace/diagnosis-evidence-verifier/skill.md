# Diagnosis Evidence Verifier

Verify that each diagnosis is supported by clinical findings.

## Inputs

- `clinical-notes`: Provider's clinical documentation
- `coding-gaps`: Codes lacking documentation support

## Outputs

- `evidence-map`: Each diagnosis linked to its supporting evidence
- `unsupported-diagnoses`: Diagnoses without adequate clinical support

## Process

1. Link each diagnosis to specific exam findings, labs, or imaging.
2. Identify diagnoses that rely on history alone without confirmation.
3. Flag conditions documented without meeting diagnostic criteria.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
