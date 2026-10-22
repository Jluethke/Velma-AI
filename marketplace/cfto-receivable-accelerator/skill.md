# Cfto Receivable Accelerator

Pull inflows earlier to fill the valleys.

## Inputs

- `cash-valleys`: The low points to fill
- `flow-calendar`: The dated inflows available to move

## Outputs

- `acceleration-plan`: Inflows that could arrive sooner and by how many days
- `expected-earlier-inflows`: Earlier inflows mapped against the valleys they relieve

## Process

1. List inflows that could arrive sooner through deposits, invoicing terms, or reminders.
2. Estimate how many days each inflow could move.
3. Map the earlier inflows against the valleys they relieve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
