# Newsletter Performance Reviewer

Review the issue's performance and update the learnings.

## Inputs

- `assembled-email`: The sent newsletter for reference
- `send-configuration`: The send settings used

## Outputs

- `issue-performance`: Performance metrics: open rate, click rate, unsubscribe rate, reply count, revenue if applicable
- `learnings-log`: What worked, what did not, and what to test next time

## Process

1. Pull performance data 48 hours after send (open rate, unique clicks, click-through rate, unsubscribes, bounces).
2. Compare against the rolling average for this newsletter.
3. Identify the winning subject line from the A/B test.
4. Log the learnings: what topic, format, or CTA performed above or below average.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
