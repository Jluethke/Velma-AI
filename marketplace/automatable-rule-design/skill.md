# Automatable Rule Design

Write an explicit rule for each automatable decision so it stops consuming attention. A good rule names the trigger and the response and covers the common cases, leaving only the exceptions for a person.

## Inputs

- `categorized-decisions`: Decisions tagged by category
- `category-counts`: Counts per category

## Outputs

- `decision-rules`: Explicit trigger-and-response rules for automatable decisions
- `rule-coverage`: Share of occurrences each rule handles without a person

## Process

1. For each automatable decision, write a rule as a trigger paired with a fixed response.
2. Test the rule against the day's log to see how many instances it would have handled.
3. Define the narrow exception path where the rule hands back to human judgment.
4. Record the share of occurrences the rule covers so low-value rules can be dropped.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
