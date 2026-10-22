# Legal Request Receiver

Receive the incoming legal request from any channel and log it.

## Inputs

- `incoming-request`: The legal request from email, form, phone, or in-person
- `requester-info`: Information about the person or department making the request

## Outputs

- `logged-request`: The request logged with a tracking ID, date, and source channel
- `initial-category`: Preliminary category based on request content

## Process

1. Log the request with a unique tracking ID, date, requester, and source channel.
2. Extract the key details: what happened, who is involved, any deadlines or urgency.
3. Assign a preliminary category based on keywords and request type.
4. Acknowledge receipt to the requester.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
