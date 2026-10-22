# Feedback Collection Aggregation

Collect all user feedback from every channel into one place.

## Inputs

- `feedback-sources`: All channels where feedback arrives (support tickets, NPS surveys, app store reviews, social media, sales calls, user interviews)
- `time-period`: The period to analyze (last quarter recommended)

## Outputs

- `feedback-corpus`: All feedback items in one list with: source, date, customer, verbatim text, and customer tier (if applicable)
- `feedback-count`: Total number of feedback items collected

## Process

1. Collect feedback from every channel. Support tickets, NPS open-text responses, app store reviews, social media mentions, sales call notes, user interview transcripts, churn survey responses.
2. Include positive AND negative feedback. Positive feedback reveals what to protect. Negative feedback reveals what to fix.
3. Attach the customer tier (enterprise, mid-market, SMB, free) to each piece of feedback. Not all feedback is equally weighted.
4. Aim for at least 100 feedback items for meaningful patterns. Fewer than 50 produces unreliable themes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
