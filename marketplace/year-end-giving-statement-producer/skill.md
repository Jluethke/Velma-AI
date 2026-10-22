# Year End Giving Statement Producer

Produce and distribute year-end giving statements for tax purposes.

## Inputs

- `giving-dashboard`: Current year giving totals
- `donor-giving-history`: Per-donor giving records

## Outputs

- `giving-statements`: Individual year-end giving statements for each donor
- `giving-summary-report`: Organization-wide giving summary for the year by fund and donor count

## Process

1. Pull each donor's complete giving record for the calendar year.
2. Generate the year-end statement with the required IRS language, itemized gifts, and annual total.
3. Distribute statements by the donor's preferred method (email or mail) by January 31.
4. Produce the organization-wide giving summary: total raised, by fund, donor count, average gift, and comparison to prior year.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
