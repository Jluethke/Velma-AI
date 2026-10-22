# Fmea Action Verifier

Verify implemented actions and rescore.

## Inputs

- `action-plan`: Recommended actions
- `risk-scores`: Original risk scores

## Outputs

- `revised-scores`: Updated severity, occurrence, detection after actions
- `fmea-document`: Complete FMEA document with before and after scores

## Process

1. Verify each action was implemented as planned
2. Rescore severity, occurrence, and detection after implementation
3. Calculate the revised RPN
4. Compile the FMEA document as a living document for future updates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
