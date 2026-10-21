# Recall And Tsb Check

Check for open recalls and technical service bulletins for a specific vehicle.

## Inputs

- `vehicle_info`: Year, make, model
- `vin`: VIN if available

## Outputs

- `open_recalls`: Any open recalls with descriptions
- `tsb_list`: Known technical service bulletins
- `action_items`: Steps to address each recall

## Process

1. Check NHTSA recall database
2. Check manufacturer recall database
3. List all open and completed recalls
4. Note any TSBs relevant to common complaints
5. Document dealer contact for recall service

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
