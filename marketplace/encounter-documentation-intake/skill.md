# Encounter Documentation Intake

Receive and review encounter documentation for billing readiness.

## Inputs

- `encounter-notes`: Clinical documentation from the provider visit
- `patient-demographics`: Patient name, DOB, insurance, account number

## Outputs

- `encounter-summary`: Structured summary of the encounter including diagnoses and procedures performed
- `documentation-gaps`: List of missing or unclear documentation that needs provider clarification

## Process

1. Review the encounter notes for completeness (chief complaint, history, exam, assessment, plan).
2. Extract the diagnoses and procedures documented by the provider.
3. Flag any documentation gaps that would prevent accurate coding.
4. Return the encounter summary and any gaps requiring follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
