# Appointment Confirmation

Confirm the appointment with the customer and calendar it for the provider.

## Inputs

- `matched-providers`: Ranked list of available providers
- `proposed-slots`: Proposed time slots

## Outputs

- `confirmed-appointment`: The confirmed appointment with date, time, provider, and customer details
- `pre-visit-checklist`: Pre-visit instructions for both the customer and the provider

## Process

1. Present the proposed time slots to the customer and confirm their selection.
2. Book the appointment on the provider's calendar and block travel time before and after.
3. Send the confirmation to the customer with date, time, provider name, and what to expect.
4. Send the provider their pre-visit checklist (service details, customer notes, location, required tools/parts).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
