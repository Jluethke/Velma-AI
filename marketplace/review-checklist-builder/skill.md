# Review Checklist Builder

Build the code review checklist and scoring rubric reviewers apply during live review.

## Inputs

- `secure-coding-standards`: Standard rules that prevent each cataloged pattern
- `pattern-severity-map`: Severity and likelihood rating for each cataloged pattern

## Outputs

- `code-review-checklist`: Ordered checks a reviewer runs against each change
- `review-rubric`: Scoring rubric for reviewer accuracy and coverage

## Process

1. Translate each standard rule into a concrete yes or no review check
2. Order checks by severity so high-impact weaknesses are caught first
3. Define rubric levels for finding rate, false positive rate, and depth
4. Mark which checks a static analyzer can automate versus human-only checks

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
