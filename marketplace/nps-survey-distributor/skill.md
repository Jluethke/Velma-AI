# Nps Survey Distributor

Configure and distribute the NPS survey through the selected channels.

## Inputs

- `nps-trigger-rules`: When each NPS survey fires
- `survey-frequency-caps`: Maximum survey frequency per customer

## Outputs

- `nps-distribution-config`: The configured survey distribution (channel, template, timing)
- `distribution-metrics`: Delivery rate, open rate, and response rate by channel

## Process

1. Select the distribution channel for each trigger (email, in-app, SMS).
2. Write the survey invitation (subject line, body, NPS question, optional follow-up open text).
3. Configure the automation to fire surveys based on trigger rules and frequency caps.
4. Monitor delivery and open rates to verify the distribution is working.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
