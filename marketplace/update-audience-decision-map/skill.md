# Update Audience Decision Map

Map each audience segment to their decision frequency. Daily updates for a weekly decision-maker is noise. Weekly updates for a daily decision-maker is too slow. Match the cadence to when decisions happen.

## Inputs

- `project-or-system-description`: What the status updates will cover
- `stakeholder-groups`: The groups who need updates and what decisions they make based on them

## Outputs

- `audience-decision-map`: For each stakeholder group: their decisions, decision frequency, and therefore their ideal update cadence
- `update-schedule`: The update schedule: who gets what, when

## Process

1. For each stakeholder group, name the decisions they make that depend on this information. If they make no decisions from it, they do not need the update.
2. Match update frequency to decision frequency: if they decide weekly, update weekly (the day before their decision meeting). If they decide daily, update daily.
3. Eliminate audiences who consume updates out of habit, not decision-making. Politely remove them from the distribution and offer opt-in.
4. Publish the schedule so everyone knows when to expect updates and stops asking for ad-hoc reports.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
