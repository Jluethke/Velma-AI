# Survival Data Preparer

Prepare the survival dataset: define the time variable, the event indicator, and the censoring mechanism.

## Inputs

- `raw-dataset`: Subject-level data with dates or times and event status
- `study-design`: Start point, endpoint definition, censoring rules, and follow-up window

## Outputs

- `survival-dataset`: Cleaned dataset with time, event (0/1), and covariates
- `censoring-summary`: Number and proportion censored, reasons for censoring

## Process

1. Define time zero (enrollment, diagnosis, randomization) for each subject.
2. Calculate time to event or censoring from time zero.
3. Code the event indicator: 1 for the event, 0 for censored observations.
4. Classify censoring reasons (end of study, loss to follow-up, competing event).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
