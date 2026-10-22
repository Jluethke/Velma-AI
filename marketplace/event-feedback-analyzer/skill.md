# Event Feedback Analyzer

Analyze event feedback quantitative scores and qualitative comments.

## Inputs

- `event-responses`: Collected survey responses
- `event-details`: Event details for context

## Outputs

- `event-scores`: Average scores by question with distribution charts
- `comment-themes`: Top themes from open-text comments (positive and negative)

## Process

1. Calculate average scores and score distributions for each rating question.
2. Calculate the event NPS from the likelihood-to-recommend question.
3. Code open-text comments by theme and sentiment (positive, negative, neutral).
4. Rank themes by frequency and identify the top 3 strengths and top 3 improvement areas.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
