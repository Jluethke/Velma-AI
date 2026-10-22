# Complaint Theme Extraction

Extract and categorize the complaint themes across all reviews.

## Inputs

- `review-corpus`: All collected reviews
- `competitor-list`: Which competitors

## Outputs

- `complaint-themes`: The 5-10 most common complaint themes across all competitors, with the count and example quotes for each
- `competitor-specific-complaints`: Themes that are specific to one competitor (their unique weakness)

## Process

1. Read every review and tag each complaint with a theme: pricing, support, reliability, features, ease of use, onboarding, performance, integration, billing.
2. Count the frequency of each theme across all reviews. A theme that appears in 40% of reviews is a structural industry problem, not just one competitor's issue.
3. Pull 3-5 example quotes for each theme. Use the reviewer's exact words. 'I spent 3 hours trying to set up the basic integration and gave up' is more useful than 'onboarding is bad.'
4. Separate universal themes (problems with every competitor) from competitor-specific themes (problems unique to one). Universal themes are positioning opportunities for your entire brand. Specific themes are competitive selling points.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
