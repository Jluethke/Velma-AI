# Design Feedback Collection

Collect annotated feedback from each reviewer and consolidate it.

## Inputs

- `review-package`: The design package sent to reviewers
- `review-schedule`: The review timeline and deadlines

## Outputs

- `raw-feedback`: All reviewer comments, annotations, and scores organized by reviewer
- `conflict-flags`: Feedback items where reviewers disagree

## Process

1. Collect feedback from each reviewer within the deadline.
2. Organize comments by design area and severity (must-fix, should-fix, suggestion).
3. Identify conflicts where reviewers give opposing feedback.
4. Produce the raw feedback and conflict flags.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
