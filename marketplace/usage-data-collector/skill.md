# Usage Data Collector

Collect actual usage data for each subscription: how often is it used, by whom, and for what specific purpose?

## Inputs

- `subscription-inventory`: The list of all active subscriptions

## Outputs

- `usage-data`: For each subscription: usage frequency (daily, weekly, monthly, rarely, never), last used date, number of users (if shared), and the specific purpose it serves
- `zombie-subscriptions`: Subscriptions with zero usage in the last 30 days

## Process

1. For each subscription, check actual usage data. For SaaS tools, check login history or activity logs. For streaming services, check viewing history. For apps, check screen time or usage stats. Do not rely on memory; check the data.
2. Record the frequency: daily (used almost every day), weekly (used at least once a week), monthly (used a few times a month), rarely (used once in the last 3 months), or never (no usage in the last 3 months).
3. For shared subscriptions (family plans, team licenses), count how many people actually use it. A team license for 10 with 2 active users is a different value proposition than one with 8 active users.
4. Flag zombie subscriptions: anything with zero usage in the last 30 days. These are immediate cancellation candidates. The only question is whether there's a cancellation fee or data loss.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
