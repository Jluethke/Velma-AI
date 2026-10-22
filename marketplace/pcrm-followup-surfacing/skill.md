# Pcrm Followup Surfacing

Turn the stored data into a working queue by surfacing exactly the contacts who have fallen past their tier cadence, sorted so the most overdue and most important rise to the top instead of drowning in the full list.

## Inputs

- `tool-field-mapping`: How fields map to the chosen tool, including the next-due date
- `automation-options`: What the tool computes automatically versus manually

## Outputs

- `overdue-followup-queue`: Contacts whose next-due date has passed, sorted by how overdue and by tier priority
- `cadence-breach-report`: A summary of how many contacts per tier are overdue, revealing where the cadence is systematically slipping

## Process

1. Build one view that filters to contacts where next-due-date is in the past. This is the only view you need day to day. Everything else is reporting.
2. Sort the queue by days-overdue within tier, so an inner-5 person two days late outranks an acquaintance a month late. Closeness breaks ties, not raw overdue days.
3. Produce the breach report: overdue count per tier. If the acquaintance tier is almost entirely overdue, the cadence is too aggressive for that tier and should be lengthened rather than endlessly chased.
4. Keep the queue small enough to act on. If it is always hundreds long, the cadences are unrealistic and the fix is in the cadence rules, not in trying harder to clear an impossible list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
