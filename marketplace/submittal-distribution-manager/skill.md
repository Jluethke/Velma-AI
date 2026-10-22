# Submittal Distribution Manager

Distribute approved submittals to subcontractors and manage resubmittals.

## Inputs

- `review-results`: Architect review results for each submittal
- `review-status-log`: Status of each submittal

## Outputs

- `distribution-log`: Log of approved submittals distributed to subcontractors
- `resubmittal-list`: List of submittals requiring resubmission

## Process

1. Distribute approved submittals to the responsible subcontractors.
2. Return rejected or revise-and-resubmit items to the subcontractor with the architect's comments.
3. Track resubmittals through the review cycle.
4. Update the submittal log with final status.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
