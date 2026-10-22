# Theme Categorization

Categorize every piece of feedback into themes and count the frequency of each theme.

## Inputs

- `feedback-corpus`: All feedback items
- `feedback-count`: Total items

## Outputs

- `theme-frequencies`: Each theme with: count, percentage of total feedback, and 3-5 example quotes
- `emerging-themes`: Themes that appeared recently but were not present in previous periods (new problems or shifting expectations)

## Process

1. Read through the feedback and tag each item with one primary theme: pricing, performance, missing feature, usability, support, reliability, onboarding, documentation.
2. Count the frequency of each theme. The distribution is usually Pareto-shaped: 2-3 themes account for 60-80% of all feedback.
3. Pull 3-5 representative quotes for each top theme. These quotes are more useful in product discussions than abstract theme labels because they convey the emotion and specificity.
4. Look for emerging themes: topics that appeared in the recent quarter but were absent in the previous one. These are early signals of a new problem.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
