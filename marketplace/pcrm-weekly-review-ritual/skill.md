# Pcrm Weekly Review Ritual

Install the lightweight weekly ritual that keeps the system alive: clear the overdue queue, log new interactions, and watch a few health metrics so that a stale CRM gets caught early instead of quietly dying.

## Inputs

- `overdue-followup-queue`: The sorted queue of contacts past cadence
- `cadence-breach-report`: Per-tier overdue counts

## Outputs

- `review-ritual-plan`: A fixed weekly routine (when, how long, what steps) for working the queue and updating records
- `maintenance-metrics`: The handful of numbers that tell you the system is healthy: percent of contacts within cadence, queue length trend, records updated this week

## Process

1. Set a fixed weekly slot of 20 to 30 minutes. A floating review that competes with everything else does not happen. Put it on the calendar as a recurring block.
2. Run the same three steps each week: work the top of the overdue queue (not the whole thing), log any interactions you have not yet recorded, and reset next-due dates for anyone you contacted.
3. Track three numbers only: percent of contacts currently within their cadence (the headline health metric), the trend in queue length (growing means the system is losing), and records updated this week (near zero means you have stopped using it).
4. Review the metrics monthly against the cadence rules. If a tier is chronically out of cadence despite effort, that is data: lengthen the cadence, shrink the tier, or accept that some outer-tier contacts are really parked, not active.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
