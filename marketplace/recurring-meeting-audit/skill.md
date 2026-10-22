# Recurring Meeting Audit

Audit all recurring meetings on the calendar to build a complete inventory.

## Inputs

- `calendar-access`: Access to the calendar(s) containing recurring meetings
- `audit-scope`: Whose meetings to audit (individual, team, department)

## Outputs

- `meeting-inventory`: List of all recurring meetings with frequency, duration, attendee count, and stated purpose
- `time-commitment`: Total hours per week spent in recurring meetings by person

## Process

1. Pull all recurring events from the calendar(s) in scope.
2. For each meeting, record: title, frequency, duration, number of attendees, organizer, and stated purpose.
3. Calculate the total hours per week each person spends in recurring meetings.
4. Flag meetings with no stated agenda or purpose, meetings with more than 8 attendees, and meetings that have been recurring for more than 6 months without review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
