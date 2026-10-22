# Rfi Router

Route the RFI to the architect, engineer, or other responsible party for response.

## Inputs

- `rfi-record`: Logged RFI with details
- `rfi-number`: RFI tracking number

## Outputs

- `routing-confirmation`: Confirmation that the RFI was sent to the reviewer
- `response-deadline`: Date by which the response is expected

## Process

1. Identify the responsible party based on the RFI subject (architect, structural engineer, MEP engineer).
2. Send the RFI with all attachments to the reviewer.
3. Set the response deadline per the contract requirements.
4. Log the routing date and reviewer in the RFI log.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
