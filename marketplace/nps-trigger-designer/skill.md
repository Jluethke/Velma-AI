# Nps Trigger Designer

Define when and how to send NPS surveys based on customer journey touchpoints.

## Inputs

- `customer-journey-map`: The key touchpoints and milestones in the customer lifecycle
- `survey-goals`: What the NPS program should measure (relationship, transactional, or both)

## Outputs

- `nps-trigger-rules`: When each NPS survey fires (post-purchase, quarterly, post-support, renewal)
- `survey-frequency-caps`: Maximum survey frequency per customer to prevent fatigue

## Process

1. Identify the touchpoints where NPS measurement adds value (post-purchase, post-support, quarterly, renewal).
2. Set the trigger conditions for each touchpoint (days after event, transaction threshold).
3. Define frequency caps so no customer receives more than one NPS survey per quarter.
4. Document the suppression rules (open support tickets, recent survey, opt-out).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
