# Time Entry Logger

Log time entries against matters with descriptions and activity codes.

## Inputs

- `approved-rates`: Rate card for the matter
- `billing-rules`: Billing rules to apply during entry

## Outputs

- `time-entries`: Raw time entries with timekeeper, date, hours, description, and activity code
- `entry-warnings`: Any entries that may violate billing guidelines

## Process

1. Record each time entry with: timekeeper, date, matter ID, hours (in tenths), activity code, and narrative description.
2. Validate each entry against billing rules (minimum increment, block billing, vague descriptions).
3. Flag entries that may violate client billing guidelines for review.
4. Calculate the total unbilled time for the period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
