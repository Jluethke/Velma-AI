# Cadence Execution Tracker

Set up the tracking system that ensures cadences actually get executed and measures whether they are producing the intended effect on relationship velocity.

## Inputs

- `content-categories`: Types of follow-up content by stage
- `content-rotation-rules`: Rules for content type rotation

## Outputs

- `execution-dashboard`: The metrics to track: follow-ups due, follow-ups completed, response rate by content type, velocity changes after follow-up
- `cadence-feedback-loop`: How to adjust cadences based on results (contacts where the cadence is too frequent get longer intervals, contacts where follow-ups consistently produce responses get shorter intervals)

## Process

1. Build the daily execution view: contacts due for follow-up today, sorted by value and urgency. Include the suggested content category (from rotation rules) and the last interaction context (from the interaction log) so execution takes minutes, not research.
2. Track two outcome metrics per follow-up: (1) did it get a response? (2) did it change the engagement velocity? A follow-up that gets a response but does not change velocity is maintenance. A follow-up that increases velocity is growth. A follow-up that gets no response is noise.
3. Build the monthly feedback loop: for each velocity segment, compare the follow-up interval to the actual response pattern. If high-velocity contacts are responding before your cadence fires, shorten the interval (you are under-serving them). If contacts consistently ignore your cadence-driven follow-ups, lengthen the interval (you are over-serving them).
4. Set the abandonment metric: if a contact's response rate to your follow-ups drops below 20% over 6 months, stop the cadence and move them to re-engagement. A cadence with a 10% response rate is training the contact to ignore you.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
