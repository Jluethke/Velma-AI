# Rfi Response Tracker

Track the RFI response timeline and follow up on overdue items.

## Inputs

- `routing-confirmation`: Confirmation of RFI routing
- `response-deadline`: Expected response date

## Outputs

- `response-status`: Current status of the RFI response
- `response-content`: The response received from the reviewer

## Process

1. Monitor the response deadline.
2. Send reminders as the deadline approaches.
3. Log the response when received with date and content.
4. Flag any responses that require clarification or follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
