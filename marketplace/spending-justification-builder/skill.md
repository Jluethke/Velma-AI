# Spending Justification Builder

For each discretionary category, build the justification: what value does this spending produce, and what evidence supports the claim?

## Inputs

- `spending-categories`: The categories set to zero
- `total-available`: The discretionary pool to allocate

## Outputs

- `justified-requests`: Each category with its requested amount, the expected return, and the evidence supporting the return estimate
- `unjustified-spending`: Categories where no clear return could be articulated, candidates for elimination

## Process

1. For each discretionary category, answer three questions: What does this spending produce? How do we know? What happens if we cut it to zero?
2. Quantify the expected return where possible. Marketing: expected revenue attributed. Training: skill gap closed. Subscriptions: hours saved per month. If you cannot quantify it, describe the qualitative impact and rate its importance.
3. For categories where the return is unclear or unmeasured, flag them as unjustified. These are the first candidates for reduction or elimination.
4. Rank the justified requests by return on investment: expected return divided by requested amount. The highest-ROI categories get funded first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
