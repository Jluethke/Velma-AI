# Cfto Flow Calendar Builder

Map all inflows and outflows by date across the horizon.

## Inputs

- `account-context`: The accounts and opening balance in scope
- `planning-horizon`: The number of days to map, such as ninety

## Outputs

- `flow-calendar`: Every inflow and outflow placed on a day-by-day calendar
- `recurring-items`: The repeating inflows and outflows with their dates

## Process

1. List every expected inflow with its date and amount.
2. List every expected outflow with its date and amount.
3. Place all items on a day-by-day calendar for the horizon.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
