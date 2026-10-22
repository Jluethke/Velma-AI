# Email Subscription Audit

Audit email subscriptions and unsubscribe from unwanted lists.

## Inputs

- `email-accounts`: Email accounts to audit
- `declutter-goals`: What a clean inbox looks like to you

## Outputs

- `subscription-list`: All subscriptions found with keep/unsubscribe decision
- `unsubscribe-count`: Number of subscriptions removed

## Process

1. Scan the inbox for subscription emails over the past 30 days.
2. Categorize each as keep, unsubscribe, or downgrade frequency.
3. Unsubscribe from all marked items.
4. Set a rule to filter remaining subscriptions to a folder.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
