# Diagnosis Procedure Coding

Assign ICD-10 diagnosis codes and CPT/HCPCS procedure codes to the encounter.

## Inputs

- `encounter-summary`: Structured summary of the encounter
- `documentation-gaps`: Any gaps flagged during intake

## Outputs

- `coded-encounter`: Encounter with assigned ICD-10 and CPT/HCPCS codes, modifiers, and units
- `coding-notes`: Notes on code selection rationale and any queries sent to the provider

## Process

1. Select the ICD-10 codes that match the documented diagnoses, sequencing the primary diagnosis first.
2. Assign the CPT or HCPCS codes for each procedure, including modifiers and units.
3. Verify that the diagnosis codes support the medical necessity of each procedure code.
4. Document the coding rationale and any queries sent back to the provider for clarification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
