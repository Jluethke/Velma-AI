# Feedback Action Router

Route actionable feedback items to the responsible team for resolution.

## Inputs

- `categorized-feedback`: Feedback items with category, urgency, and sentiment tags

## Outputs

- `routed-items`: Feedback items assigned to a team with resolution SLA
- `routing-rules`: The rules used to assign items to teams

## Process

1. Match each feedback category to the responsible team (product, engineering, support, operations).
2. Assign a resolution SLA based on urgency level.
3. Send the feedback item to the assigned team with context (original text, source, customer info).
4. Flag items that match multiple categories for joint review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
