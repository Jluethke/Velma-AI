# Lifecycle Field Mapping

Map the lifecycle system onto whatever tool stores your contacts (CRM, spreadsheet, phone contacts, or a dedicated system) by defining the fields, automations, and views needed.

## Inputs

- `trigger-rules`: The re-engagement trigger conditions
- `re-engagement-actions`: Suggested actions per trigger

## Outputs

- `field-schema`: The fields to add to each contact record: current stage, last interaction date, interaction count, decay deadline, parked flag
- `view-definitions`: The filtered views needed: approaching decay, recently upgraded, recently downgraded, parked, by stage

## Process

1. Define the minimum fields: current_stage (enum), last_interaction_date (date), interaction_count_90d (integer), decay_deadline (computed date), next_action (text), parked (boolean). These six fields are enough to run the system regardless of tool.
2. Design the views. The daily working view is 'approaching decay, sorted by deadline.' The weekly review view is 'stage changes this week.' The strategic view is 'stage distribution histogram' (if 80% of your contacts are acquaintances and 2% are trusted, your network is wide but shallow).
3. Define the update protocol: when do fields get refreshed? After every interaction, update last_interaction_date and increment interaction_count_90d. Stage transitions happen on the next review cycle, not in real time (to prevent flapping). Review cycles should be weekly for personal use, daily for sales.
4. If the tool supports automation, configure the decay deadline as a computed field (last_interaction_date + decay_window_for_stage). If not, build a weekly batch process to recalculate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
