# Bad Fit Deal Review

Review deals that closed but then churned, demanded heavy discounts, or drained support, to find what bad fit looks like.

## Inputs

- `account-history`: Won accounts with renewal status, discount level, and expansion history
- `support-record`: Support and success records showing ticket load and escalations by account

## Outputs

- `bad-fit-signals`: Signals that showed up before a deal turned into a bad-fit account
- `cost-to-serve-notes`: Where bad-fit accounts cost more than they returned

## Process

1. Pull accounts that churned early, needed deep discounts to close, or generated outsized support load.
2. For each, look back at the sales cycle and note what was visible before the deal closed.
3. List the early signals that correlate with the bad outcome, such as a mismatched use case or an unrealistic timeline.
4. Note the cost to serve each pattern, in support hours, discount dollars, and team strain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
