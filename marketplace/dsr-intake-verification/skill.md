# Dsr Intake Verification

Receive a data subject request and verify the identity of the requester.

## Inputs

- `request-details`: The data subject request including type (access, deletion, correction, portability) and requester information
- `applicable-regulations`: The privacy regulations that apply (GDPR, CCPA, state laws)

## Outputs

- `verified-request`: The validated request with confirmed requester identity
- `request-type`: The classified request type and applicable deadline

## Process

1. Log the request with a unique tracking number and timestamp.
2. Verify the requester's identity using available information (account match, government ID, knowledge-based verification).
3. Classify the request type (access, deletion, correction, portability) and determine the legal deadline for response.
4. Acknowledge receipt to the requester within the required timeframe.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
