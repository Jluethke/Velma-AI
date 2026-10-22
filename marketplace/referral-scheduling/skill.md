# Referral Scheduling

Schedule the referred patient for the appropriate visit type.

## Inputs

- `verified-referral`: Confirmed referral with authorization
- `patient-info`: Patient contact and insurance information

## Outputs

- `scheduled-appointment`: Appointment date, time, provider, and location
- `pre-visit-packet`: Instructions and forms sent to the patient before the visit

## Process

1. Match the referral to the appropriate provider and visit type.
2. Schedule the appointment within the authorization timeframe.
3. Send the patient the appointment confirmation and pre-visit instructions.
4. Request relevant records from the referring provider.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
