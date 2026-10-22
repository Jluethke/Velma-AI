# Followup Completion Tracking

Build the tracking that ensures scheduled follow-ups actually get completed and that overdue ones get caught rather than silently abandoned, because a follow-up system that captures and schedules but does not enforce completion just produces a well-organized list of broken intentions.

## Inputs

- `scheduling-rules`: Rules for assigning follow-ups specific dates
- `due-date-logic`: How dates are set based on urgency and relationship rhythm

## Outputs

- `completion-tracker`: The mechanism for seeing follow-ups due today, marking them done, and spotting what slipped
- `overdue-escalation-rules`: What happens to an overdue follow-up: reschedule with intent, do it now, or consciously drop it

## Process

1. Build a daily view of follow-ups due today, so working the system is a short routine (see what is due, do it or reschedule it) rather than an open-ended search through a backlog.
2. Mark completion explicitly. The act of marking a follow-up done both clears it and gives you a visible record of reliability, which is the evidence the review step uses later.
3. Catch the overdue rather than letting them vanish. An overdue follow-up should resurface, not disappear, because the whole value of the system is that nothing meant to happen quietly fails to.
4. Set an honest rule for overdue items: either reschedule with a real new date and intent, do it now, or consciously drop it and let the person go. An item rescheduled five times is one you have decided not to do, and naming that is better than carrying it as permanent guilt.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
