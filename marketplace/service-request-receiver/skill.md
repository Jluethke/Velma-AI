# Service Request Receiver

Receive and validate the service request.

## Inputs

- `request-details`: What the user is requesting
- `requester-info`: Who is making the request and their role

## Outputs

- `validated-request`: Request validated against the service catalog
- `fulfillment-path`: Which team and workflow will fulfill this request

## Process

1. Match the request to a service catalog entry.
2. Verify the requester is eligible for the service.
3. Check if approval is required based on the approval matrix.
4. Route to the appropriate fulfillment team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
