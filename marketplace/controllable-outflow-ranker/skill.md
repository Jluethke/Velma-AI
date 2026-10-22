# Controllable Outflow Ranker

Rank outflows by how much control you have over their timing, separating fixed obligations from movable payments.

## Inputs

- `daily-flow-calendar`: Inflows and outflows by day of month
- `flow-classification`: Each flow classified as fixed, variable, or discretionary

## Outputs

- `timing-control-ranking`: Each outflow scored on a 0-to-3 scale: 0 = cannot move (rent, loan auto-pay), 1 = can move within a week, 2 = can move within the month, 3 = fully discretionary
- `movable-outflows`: The subset of outflows with a timing control score of 1 or higher, with their current day and amount

## Process

1. For each outflow, determine the timing constraint. Auto-debits on a fixed date score 0. Bills with a due date but no auto-pay score 1 (you control when before the due date you pay). Vendor invoices with net terms score 2. Discretionary purchases score 3.
2. For score-1 outflows, note the due date and the earliest you can pay without penalty. The window between those dates is your flexibility range.
3. For score-2 outflows (net-30, net-60 invoices), note the invoice date and the final due date. The entire term is your flexibility range.
4. Sort by amount descending within each score tier. The largest movable outflows are the biggest levers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
