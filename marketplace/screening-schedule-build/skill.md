# Screening Schedule Build

Build the screening and checkup schedule from the risk profile, placing each appointment on a calendar rather than leaving it to memory.

## Inputs

- `risk-profile`: The combined risk profile
- `risk-flags`: The elevated risks needing earlier screening

## Outputs

- `screening-schedule`: The set of checkups and screenings with their recommended intervals
- `checkup-calendar`: The schedule placed onto actual dates for the coming year

## Process

1. List the standard checkups for your profile, such as an annual physical, dental visits, vision checks, and the age-appropriate screenings for your profile.
2. Adjust intervals for each risk flag. An elevated risk may move a screening earlier or make it more frequent than the standard interval.
3. Confirm anything beyond the routine with a clinician. The system schedules and tracks care, it does not replace the judgment of a professional about what you specifically need.
4. Place each appointment on actual dates across the year, spacing them so they do not all fall in one month, and treat the dates as booked commitments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
