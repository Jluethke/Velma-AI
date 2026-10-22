# Post Service Review Requester

Request a review from the customer after they pick up the vehicle.

## Inputs

- `status-updates-log`: Communication history for this visit
- `ready-notification`: Vehicle ready notification for timing the review request

## Outputs

- `review-request-sent`: Review request sent with link and delivery status
- `communication-record`: Complete communication record for this service visit

## Process

1. Wait an appropriate interval after pickup (24 to 48 hours).
2. Send a review request with a link to Google, Yelp, or the shop's review platform.
3. Include a brief thank-you and a way to contact the shop directly if there are concerns.
4. Close the communication record for this service visit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
