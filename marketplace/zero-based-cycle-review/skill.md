# Zero Based Cycle Review

Review the zero-based budget at period end. Compare actual returns to justified estimates. Categories that delivered less than promised lose credibility in the next cycle.

## Inputs

- `variance-tracking-plan`: The tracking setup and actual variances
- `justified-requests`: The original justifications with expected returns

## Outputs

- `return-scorecard`: Each category's promised return vs. actual return, with a credibility rating for the next cycle
- `next-cycle-inputs`: The spending data, return data, and credibility ratings that feed the next zero-based cycle

## Process

1. For each funded category, compare the actual return to the justified estimate. Calculate the accuracy: actual divided by estimated.
2. Categories that consistently overestimate their returns lose credibility. In the next cycle, their estimates are discounted by their historical accuracy rate.
3. Categories that consistently deliver are trusted. Their estimates carry full weight in the next cycle.
4. Feed the scorecard into the next zero-based cycle. The discipline improves over time as estimate accuracy is tracked and calibrated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
