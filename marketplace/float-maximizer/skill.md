# Float Maximizer

Maximize the float: the period between collecting and paying. Float is free financing. The goal is to collect as early as possible and pay as late as allowed.

## Inputs

- `revised-calendar`: The adjusted cash flow calendar
- `income-sources`: The inflow sources and their terms

## Outputs

- `float-analysis`: The average float in days (weighted by amount) and the interest or investment income the float generates
- `float-improvement-plan`: Actions to extend the float: earlier collection, later payment, higher-yield sweep accounts

## Process

1. Calculate the average float: for each dollar, how many days does it sit in your account between collection and disbursement? Weight by amount.
2. For the float period, determine where the cash sits. If it is in a zero-interest checking account, the float generates nothing. Move it to a high-yield sweep account or money market fund.
3. Identify float extension opportunities: can collection be moved earlier without losing customers? Can payment be moved later without losing vendor goodwill or triggering penalties?
4. Calculate the annual value of the float: average float balance times the yield rate. Even small yields on large floats produce meaningful returns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
