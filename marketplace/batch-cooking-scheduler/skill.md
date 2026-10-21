# Batch Cooking Scheduler

Schedule batch cooking sessions to maximize efficiency: what to cook when, simultaneous oven and stovetop use.

## Inputs

- `recipe_list`: All recipes for the week
- `available_prep_days`: Which days are available for cooking
- `kitchen_equipment`: Available equipment (oven, slow cooker, etc.)

## Outputs

- `prep_schedule`: Hour-by-hour cooking schedule
- `equipment_timeline`: When each appliance is in use
- `prep_order`: What to prepare in what sequence

## Process

1. Group recipes by cooking method
2. Identify components that can cook simultaneously
3. Schedule longest-cooking items first
4. Plan prep work during cooking downtime
5. Build minute-by-minute cooking timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
