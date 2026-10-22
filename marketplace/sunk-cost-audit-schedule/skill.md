# Sunk Cost Audit Schedule

Set a recurring schedule for the sunk-cost audit. Quarterly is recommended. Sunk costs accumulate slowly; without a recurring audit, new commitments drift into the same trap. The audit takes 30 to 60 minutes and the payoff compounds over years.

## Inputs

- `exit-plans`: The current round of exits
- `freed-resources`: Resources recovered this round

## Outputs

- `audit-schedule`: The quarterly audit dates and the checklist to run each time
- `sunk-cost-audit-report`: The complete report for this round: commitments audited, exits planned, resources freed

## Process

1. Set the next audit date (3 months from now).
2. At each audit, re-run the fresh-start test on all active commitments (including new ones added since the last audit).
3. Track the cumulative resources freed by the sunk-cost audit process over time.
4. If the audit consistently finds nothing to cut, extend the interval to 6 months. If it consistently finds cuts, keep it quarterly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
