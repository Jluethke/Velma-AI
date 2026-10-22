# Drug Interaction Checker

Check for drug-drug and drug-allergy interactions.

## Inputs

- `source-med-lists`: Combined medication list
- `allergy-list`: Patient's documented allergies

## Outputs

- `interaction-alerts`: Identified interactions with severity ratings
- `allergy-conflicts`: Medications conflicting with documented allergies

## Process

1. Run the combined list through the interaction database.
2. Flag clinically significant interactions by severity.
3. Check each medication against the allergy list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
