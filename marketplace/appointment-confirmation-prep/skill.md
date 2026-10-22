# Appointment Confirmation Prep

Book the appointment and send confirmation with pre-visit instructions.

## Inputs

- `offered-slots`: Available slots presented to the patient
- `patient-record`: Patient contact information

## Outputs

- `booked-appointment`: Confirmed appointment with date, time, provider, location, and visit type
- `scheduling-record`: Complete scheduling record including waitlist management

## Process

1. Book the selected slot and update the provider's schedule.
2. Send the patient the appointment confirmation via their preferred channel (text, email, portal).
3. Include pre-visit instructions (forms, fasting, what to bring).
4. Set up the appointment reminder sequence (48 hours, 24 hours before).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
