# Disqualification Criteria Definition

Define the specific criteria that make a prospect a bad fit, based on historical data about which deals close and which do not.

## Inputs

- `deal-history`: Historical deals with outcomes (won, lost, stalled)
- `product-fit`: What your product does well and what it does not do

## Outputs

- `disqualification-criteria`: 5-7 specific criteria that predict a deal will not close (wrong size, wrong industry, missing budget, no champion, using a competitor they are happy with, timeline too long, need a feature you do not have)
- `criteria-evidence`: For each criterion: the historical close rate for deals that met this criterion vs deals that did not

## Process

1. Analyze your historical deals. Group by outcome (won vs lost). Look for characteristics that are overrepresented in losses: industry, company size, deal size, buying process length, number of decision makers, stated budget.
2. The best disqualification criteria are the ones with the strongest predictive power: deals with this characteristic close at less than 10% vs the overall close rate of 25%.
3. Limit to 5-7 criteria. More than 7 and every prospect gets disqualified. The criteria should be binary (yes/no) and verifiable early in the sales process.
4. Include at least one behavioral criterion, not just demographic. 'The prospect does not respond to follow-ups within 5 business days' is a behavioral disqualification signal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
