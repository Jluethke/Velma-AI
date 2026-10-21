# Citizen Quality Validator

Validate citizen science submissions using automated checks, expert review, and consensus algorithms to flag and correct errors.

## Inputs

- `submitted-data`: Raw observations from citizen scientists
- `expert-panel`: Available experts for review of uncertain identifications
- `validation-rules`: Automated checks (GPS in study area, photo present, values in range)

## Outputs

- `validated-dataset`: Submissions that passed validation with confidence scores
- `flagged-records`: Submissions needing expert review or re-observation
- `volunteer-feedback`: Per-volunteer accuracy scores and personalized improvement tips

## Process

1. Run automated validation rules on all incoming submissions
2. Route records that pass automated checks through community consensus (multiple IDs)
3. Escalate records without consensus to the expert review panel
4. Score each volunteer's accuracy rate based on agreement with validated records
5. Send personalized feedback to volunteers with common errors and tips

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
