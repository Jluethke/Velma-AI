# Scheduling Request Intake

Receive and categorize the scheduling request by visit type and urgency.

## Inputs

- `scheduling-request`: Patient's request for an appointment (phone, portal, in-person, referral)
- `patient-record`: Patient demographics and insurance on file

## Outputs

- `categorized-request`: Request categorized by visit type (new, follow-up, procedure, urgent) and urgency
- `scheduling-constraints`: Constraints on scheduling (specific provider, insurance network, authorization needed)

## Process

1. Determine the visit type from the patient's reason for the appointment.
2. Check urgency (routine, urgent, same-day).
3. Identify scheduling constraints (provider preference, insurance network, referral/authorization).
4. Verify the patient's insurance is active and in-network.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
