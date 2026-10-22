# Turnaround Time Tracker

Track room turnaround time and handle exceptions.

## Inputs

- `daily-schedule`: Housekeeping schedule
- `cleaning-checklist`: Cleaning standards

## Outputs

- `turnaround-metrics`: Average turnaround time by room type and attendant
- `housekeeping-schedule`: Final housekeeping schedule with metrics and exceptions handled

## Process

1. Log the start and end time for each room.
2. Calculate average turnaround by room type.
3. Track rush requests and late checkouts.
4. Produce the daily performance report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
