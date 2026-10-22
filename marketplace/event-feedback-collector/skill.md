# Event Feedback Collector

Distribute the event feedback survey and monitor response rates.

## Inputs

- `event-survey`: The event feedback survey instrument
- `distribution-timing`: When and how to distribute

## Outputs

- `event-responses`: Collected survey responses from attendees
- `event-response-rate`: Response rate and completion rate

## Process

1. Send the survey to all attendees within 24 hours of event close.
2. Send one reminder to non-respondents 48 hours after the initial send.
3. Monitor response and completion rates daily.
4. Close the survey after 7 days or when response rate plateaus.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
