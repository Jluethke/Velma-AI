# Housekeeping Staff Assigner

Assign rooms to housekeeping attendants based on workload.

## Inputs

- `turnover-forecast`: Room turnover forecast
- `labor-hours-needed`: Labor hours needed

## Outputs

- `room-assignments`: Rooms assigned to each attendant
- `daily-schedule`: Shift schedule with start times and breaks

## Process

1. Distribute rooms evenly by credit (departure rooms count more).
2. Group assignments by floor or section to minimize travel.
3. Schedule shifts to match the arrival pattern.
4. Post the assignments before each shift.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
