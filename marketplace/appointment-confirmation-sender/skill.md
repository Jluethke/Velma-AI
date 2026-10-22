# Appointment Confirmation Sender

Send appointment confirmation and reminders to the customer.

## Inputs

- `appointment-details`: Date, time, vehicle, and services scheduled
- `customer-contact`: Customer name, phone, email, and communication preference

## Outputs

- `confirmation-sent`: Confirmation message sent with delivery status
- `reminder-schedule`: Scheduled reminders (24 hours before, morning of) with send times

## Process

1. Send the appointment confirmation via the customer's preferred channel (text, email, phone).
2. Include the date, time, vehicle, and services scheduled.
3. Schedule a reminder for 24 hours before the appointment.
4. Schedule a morning-of reminder on the day of the appointment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
