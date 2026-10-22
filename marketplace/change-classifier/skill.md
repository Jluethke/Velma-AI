# Change Classifier

Classify the change as standard, normal, or emergency.

## Inputs

- `change-request`: The submitted change request
- `impact-assessment`: Impact and risk rating

## Outputs

- `change-classification`: Classification: standard, normal, or emergency
- `approval-requirements`: Who must approve based on classification

## Process

1. Compare the change against pre-approved standard change models.
2. If no standard model matches, classify as normal or emergency based on urgency.
3. Determine the approval path for the classification.
4. Assign the change to the appropriate review queue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
