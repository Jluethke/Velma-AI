# Training Completion Analyzer

Measure training completion rates and quiz scores across the organization.

## Inputs

- `training-materials`: Training platform data
- `content-review-findings`: Content review findings for correlation

## Outputs

- `completion-metrics`: Completion rates by department, role, and seniority
- `knowledge-retention-gaps`: Topics where quiz scores indicate poor retention

## Process

1. Extract completion rates from the training platform by department and role
2. Analyze quiz scores to identify topics with consistently low scores
3. Check for completion rate differences between departments (engineering, sales, executives)
4. Identify repeat non-completers and whether enforcement mechanisms exist

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
