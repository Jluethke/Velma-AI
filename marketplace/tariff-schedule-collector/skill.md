# Tariff Schedule Collector

Collect and parse the current utility tariff schedules.

## Inputs

- `utility-accounts`: List of utility accounts with account numbers and service addresses
- `current-bills`: Recent utility bills showing the current rate schedule

## Outputs

- `tariff-details`: Parsed tariff components (demand charges, energy charges, time-of-use periods, fixed fees)
- `rate-alternatives`: Alternative rate schedules available from the utility

## Process

1. Identify the current rate schedule for each account from the bill or utility portal.
2. Parse the tariff into its components: demand charges (per kW), energy charges (per kWh), fixed fees, and any time-of-use periods.
3. Obtain the utility's full tariff book and identify alternative rate schedules the account may qualify for.
4. Note any pending rate cases or tariff changes that could affect future costs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
