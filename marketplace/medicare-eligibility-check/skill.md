# Medicare Eligibility Check

Determine Medicare eligibility, enrollment windows, and penalties for late enrollment.

## Inputs

- `age`: Current age
- `work_history`: Years of Medicare tax payments
- `current_insurance`: Current health coverage
- `disability_status`: Any disability qualifications

## Outputs

- `eligibility_status`: Parts A, B, C, D eligibility
- `enrollment_windows`: When to enroll for each part
- `penalty_risks`: Late enrollment penalty exposure

## Process

1. Verify Part A eligibility and premium status
2. Check Part B enrollment requirements
3. Identify enrollment period dates
4. Calculate late enrollment penalties if applicable
5. Map employer coverage coordination rules

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
