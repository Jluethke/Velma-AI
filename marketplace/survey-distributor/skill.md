# Survey Distributor

Distribute surveys at the configured trigger points.

## Inputs

- `survey-design`: Finalized survey instrument
- `sampling-plan`: Distribution targets and triggers

## Outputs

- `distribution-log`: Record of surveys sent with timestamps
- `response-data`: Raw survey responses

## Process

1. Configure the distribution channel (email, in-app, SMS).
2. Send surveys at each trigger point per the sampling plan.
3. Track delivery and response rates.
4. Collect raw responses.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
