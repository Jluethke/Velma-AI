# Feedback Loop Closer

Close the loop with customers who submitted feedback when their request ships.

## Inputs

- `theme-to-roadmap-map`: Mapping of feedback themes to roadmap items
- `aggregated-feedback`: Original feedback items with customer contact info

## Outputs

- `closure-notifications`: Messages sent to customers about shipped features they requested
- `feedback-pipeline-report`: Full pipeline report with volumes, themes, planning inputs, and closure rates

## Process

1. Monitor the roadmap for items that ship and match them to feedback themes.
2. Identify the customers who submitted feedback for each shipped theme.
3. Send a notification explaining what was built and how their feedback contributed.
4. Produce the pipeline report with intake volume, theme distribution, planning conversion rate, and closure stats.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
