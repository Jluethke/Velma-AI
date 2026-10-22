# Influence Interest Scorer

Score each stakeholder on two dimensions: influence (their power to affect the outcome) and interest (how much they care). Use evidence, not assumptions.

## Inputs

- `full-roster`: The complete stakeholder list
- `initiative-description`: The initiative being mapped

## Outputs

- `scored-roster`: Each stakeholder with influence score (1-5) and interest score (1-5) with evidence for each
- `quadrant-assignment`: Each stakeholder assigned to a quadrant: Manage Closely, Keep Satisfied, Keep Informed, Monitor

## Process

1. Score influence from 1 (no power to affect outcome) to 5 (can approve, veto, or kill the initiative). Evidence: their role, their budget authority, their political capital.
2. Score interest from 1 (does not know or care about the initiative) to 5 (deeply invested in the outcome, checks on it regularly). Evidence: their questions, their meeting attendance, their emails.
3. Assign quadrants: high influence + high interest = Manage Closely. High influence + low interest = Keep Satisfied. Low influence + high interest = Keep Informed. Low influence + low interest = Monitor.
4. Flag mismatches: a high-influence stakeholder you have been treating as low-interest is your biggest risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
