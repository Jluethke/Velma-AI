# Departure Data Assembler

Assemble departures over a defined window into structured records and look for clusters. A cluster is three or more departures that share a manager, a tenure band, a team, or a stated reason.

## Inputs

- `departure-records`: Raw records or notes for departures in the analysis window
- `analysis-window`: The time window to examine, such as the past 24 months

## Outputs

- `coded-departure-data`: Structured records with anonymized identity, stated reason, tenure, team, manager, role, and last rating
- `departure-clusters`: Groups of three or more departures sharing a common attribute, with managers above 1.5 times the base rate flagged

## Process

1. For each departure in the window, record anonymized identity, stated reason, tenure in months, team, manager, role, and last performance rating.
2. Group departures by manager, tenure band, team, and stated reason, and count each group.
3. Flag any group of three or more, and any manager whose departure rate runs above 1.5 times the company rate.
4. Note the data quality: what share of departures have complete records? Below 70 percent, the data carries a selection bias.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
