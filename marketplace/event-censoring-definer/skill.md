# Event Censoring Definer

Define the event of interest, censoring rules, and time origin for survival analysis.

## Inputs

- `study-data`: Patient or subject-level data with dates and outcomes
- `event-definition`: What constitutes the event (death, relapse, failure)

## Outputs

- `survival-dataset`: Dataset with time, event indicator, and covariates for each subject
- `censoring-summary`: Proportion censored, follow-up time distribution, and event count

## Process

1. Define the event, censoring conditions (lost to follow-up, study end, competing event).
2. Compute the survival time from the origin to event or censoring date.
3. Create the binary event indicator.
4. Summarize median follow-up, event rate, and censoring proportion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
