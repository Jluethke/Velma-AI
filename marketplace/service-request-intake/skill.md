# Service Request Intake

Receive and triage the service request to determine scheduling requirements.

## Inputs

- `service-request`: The customer's service request (type, urgency, location, preferences)
- `service-area-map`: The geographic service area and zone definitions

## Outputs

- `triaged-request`: Request classified by service type, urgency, zone, estimated duration, and required skills
- `scheduling-constraints`: Constraints on when the service can be scheduled (customer availability, parts needed, permits)

## Process

1. Receive the service request and extract: service type, location, urgency level, and customer preferences.
2. Classify the request by zone (geographic area) and estimate the duration based on service type.
3. Identify any prerequisites (parts need to be ordered, permits required, previous visit notes to review).
4. Determine the customer's available time windows for the appointment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
