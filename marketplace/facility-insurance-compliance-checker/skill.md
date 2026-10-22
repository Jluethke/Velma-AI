# Facility Insurance Compliance Checker

Handle liability and insurance requirements for facility use.

## Inputs

- `setup-instructions`: Event setup and access details
- `post-event-inspection`: Post-event condition report

## Outputs

- `insurance-log`: Record of insurance certificates received and verified for each external booking
- `facility-use-report`: Summary of all bookings, revenue, expenses, and issues for the period

## Process

1. Require external users to provide a certificate of insurance naming the organization as additional insured.
2. Verify the certificate: coverage amount, dates, and additional insured endorsement.
3. Maintain the insurance log with certificates filed by booking.
4. Produce the facility use report: bookings by type, revenue collected, maintenance costs, and issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
