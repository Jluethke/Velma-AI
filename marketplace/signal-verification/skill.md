# Signal Verification

Verify the top themes by checking whether they correlate with churn, low NPS, or declining engagement.

## Inputs

- `priority-themes`: Top 3 themes
- `feedback-corpus`: Feedback with customer data

## Outputs

- `verification-results`: For each top theme: correlation with churn (do customers who mention this theme churn at a higher rate?), NPS (do they score lower?), and engagement (do they use the product less?)
- `confirmed-priorities`: Themes that are both frequent AND correlated with negative outcomes (these are verified priorities, not just complaints)

## Process

1. For each top theme, check the churn rate of customers who raised it vs customers who did not. If customers who complain about 'poor performance' churn at 2x the rate, the performance theme is confirmed as a retention driver.
2. Check NPS scores: do customers who raised this theme score significantly lower on NPS?
3. Check engagement: do customers who raised this theme use the product less frequently or less deeply?
4. Themes that are frequent, value-weighted, AND correlated with negative outcomes are the highest-confidence priorities. Themes that are frequent but not correlated with outcomes may be annoyances, not retention risks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
