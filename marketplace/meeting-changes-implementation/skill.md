# Meeting Changes Implementation

Implement the approved meeting changes and update the calendar.

## Inputs

- `change-recommendations`: Approved meeting changes
- `projected-time-savings`: Expected time savings

## Outputs

- `implemented-changes`: Record of which changes were made to which meetings
- `optimization-report`: Complete meeting optimization report with before/after metrics

## Process

1. For each approved change, update the calendar event (cancel, change recurrence, shorten, update attendees).
2. Notify all affected attendees of the change and the reason.
3. For meetings converted to async, set up the replacement (shared doc, Slack channel, weekly written update).
4. After 4 weeks, measure actual time recovered and compare to projections.
5. Compile the optimization report with before and after metrics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
