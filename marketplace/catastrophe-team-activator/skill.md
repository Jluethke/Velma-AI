# Catastrophe Team Activator

Activate the catastrophe response team and establish the command structure.

## Inputs

- `event-notification`: Notification of the catastrophe event (storm, earthquake, wildfire, flood) with initial scope
- `cat-response-playbook`: The company's catastrophe response playbook and resource roster

## Outputs

- `activated-team`: The activated response team with roles, contact information, and reporting structure
- `initial-exposure-estimate`: Estimated policyholder exposure in the affected area (policy count, total insured value)

## Process

1. Declare the catastrophe event and assign the event code.
2. Activate the response team per the playbook (claims, underwriting, communications, IT).
3. Estimate the policyholder exposure by geocoding policies against the event footprint.
4. Establish the communication cadence and reporting structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
