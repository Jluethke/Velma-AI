# Retainer Utilization Tracking

Track hours used against the retainer allocation each month.

## Inputs

- `retainer-agreement`: The retainer terms
- `tracking-setup`: Tracking configuration

## Outputs

- `utilization-data`: Hours used, hours remaining, and percentage utilized for the current period
- `work-log`: Itemized log of work performed under the retainer

## Process

1. Log all retainer work with the date, hours, and description.
2. Calculate the running utilization against the monthly allocation.
3. Alert the client when utilization reaches 75% and 90% of the allocation.
4. Track any rollover hours from prior months separately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
