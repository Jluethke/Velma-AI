# Debt Cost Calculator

Calculate the cost of each piece of organizational debt. Cost equals the time spent per occurrence times the number of people involved times the frequency per year times the average hourly cost of those people. This converts vague complaints ('this meeting is useless') into a dollar figure that motivates action.

## Inputs

- `origin-stories`: Why each process exists and whether the reason still applies
- `still-valid-flags`: Whether each process is still valid, partially valid, or no longer valid

## Outputs

- `debt-cost-table`: For each item marked as partially valid or no longer valid: the annual cost in hours and dollars
- `total-debt-cost`: The total annual cost of organizational debt across all items

## Process

1. For each item marked partially valid or no longer valid, calculate: time per occurrence (hours) times number of people involved times occurrences per year.
2. Multiply by the average loaded hourly cost of the involved people. This is the annual cost of this piece of debt.
3. Sum all items. This is the total annual cost of organizational debt for this team or department.
4. Rank items by annual cost. The most expensive items are the highest priority to eliminate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
