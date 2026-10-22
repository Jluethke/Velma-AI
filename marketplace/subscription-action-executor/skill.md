# Subscription Action Executor

Execute the audit decisions: cancel the bottom quartile, renegotiate the lower-middle, and document the keepers.

## Inputs

- `quartile-ranking`: Subscriptions divided into quartiles with scores
- `scored-subscriptions`: The detailed scoring for each subscription

## Outputs

- `cancellation-results`: Each cancelled subscription with the effective date, any cancellation fee, and the monthly savings
- `renegotiation-results`: Each renegotiated subscription with the old price, the new price or alternative, and the monthly savings
- `subscription-audit-report`: The complete audit: inventory, usage data, scores, actions taken, total monthly savings, and the schedule for the next audit

## Process

1. For each bottom-quartile subscription: check for a cancellation fee or early termination penalty. If the fee is less than 3 months of the subscription cost, cancel immediately. If higher, schedule cancellation at the next renewal date and set a reminder.
2. For each lower-middle subscription: contact the provider and ask for a discount or downgrade to a lower tier. Mention the specific alternatives you found. Many providers offer 20 to 40% retention discounts when you mention cancellation. If no discount is available, evaluate whether the score is close enough to the keep threshold to justify the current price.
3. For keepers: document why each is kept, its score, and the next review date. This prevents re-auditing subscriptions that were already justified.
4. Calculate total monthly savings from cancellations and renegotiations. Annualize the savings. Set the next full audit for 6 months out, with a monthly spot-check for any new subscriptions added since the audit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
