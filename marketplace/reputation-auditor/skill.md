# Reputation Auditor

Audit current reviews and mentions across platforms.

## Inputs

- `business-name`: The business or brand name
- `review-platforms`: Platforms to audit (Google, Yelp, Glassdoor, Trustpilot, social media, industry-specific sites)

## Outputs

- `reputation-snapshot`: Current ratings, review counts, and sentiment breakdown across all platforms
- `critical-reviews`: List of unanswered or critical reviews requiring immediate attention

## Process

1. Pull the current rating and review count from each platform.
2. Categorize reviews by sentiment (positive, neutral, negative).
3. Identify unanswered reviews, especially negative ones.
4. Produce the reputation snapshot with platform-by-platform breakdown.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
