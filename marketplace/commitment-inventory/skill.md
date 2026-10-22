# Commitment Inventory

Inventory every ongoing commitment: subscriptions, projects, contracts, memberships, recurring meetings, habits, investments being held.

## Inputs

- `scope`: What to audit (personal finances, business operations, team calendar, project portfolio, investment portfolio)
- `time-period`: The lookback period for identifying commitments (typically 12 months)

## Outputs

- `commitment-list`: Every ongoing commitment with: what it is, what it costs per period (in money, time, or attention), when it started, and when it was last evaluated
- `auto-renewal-flags`: Commitments that auto-renew without active decision, which are the most likely to persist without value

## Process

1. Pull every recurring charge from bank and credit card statements. Pull every recurring meeting from the calendar. Pull every active project from the task list. Pull every held investment from the portfolio.
2. For each, record: the ongoing cost per period (dollars, hours, attention units), when the commitment started, and whether there was an active decision to continue it in the last 12 months.
3. Flag auto-renewal commitments: subscriptions, memberships, retainers, and recurring meetings that continue unless someone actively cancels them. These are the highest-risk sunk cost traps.
4. Sort by cost per period, highest first. The most expensive commitments deserve the most scrutiny.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
