# Impact Score With Frequency Weight

Score each feature's impact by: number of users affected times frequency of use times severity of the problem it solves.

## Inputs

- `feature-list`: All feature candidates
- `current-roadmap`: Existing plans for context

## Outputs

- `impact-scores`: Each feature scored on impact: users-affected (1-10) x frequency-of-use (1-10) x severity (1-10)
- `impact-rationale`: For each feature: why the score was assigned, with evidence

## Process

1. Score users-affected (1-10): 1 = a handful of users, 10 = nearly all users. Use actual data: what percentage of users encounter the situation this feature addresses?
2. Score frequency-of-use (1-10): 1 = once per year or less, 10 = multiple times per day. A feature used daily by 50% of users has more impact than a feature used yearly by 100%.
3. Score severity (1-10): 1 = minor annoyance, 10 = blocks the user from accomplishing their task. A feature that unblocks users scores higher than one that makes a working flow slightly better.
4. Multiply the three scores. The product is the impact score. A feature with users=7, frequency=8, severity=3 scores 168. A feature with users=3, frequency=2, severity=10 scores 60. The daily-use feature wins despite lower severity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
