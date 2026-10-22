# Foia Request Intake

Receive and log the FOIA request with tracking details.

## Inputs

- `foia-request`: The incoming request with requester name, description of records sought, and preferred format
- `agency-foia-rules`: Agency-specific FOIA regulations, fee schedules, and timelines

## Outputs

- `logged-request`: Request logged with tracking number, receipt date, and statutory deadline
- `scope-assessment`: Preliminary assessment of which offices hold responsive records

## Process

1. Log the request with a tracking number and the date received.
2. Calculate the statutory response deadline (20 business days, or 10 for expedited).
3. Identify which offices or systems likely hold responsive records.
4. Send the acknowledgment letter to the requester.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
