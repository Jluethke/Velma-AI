# Driver Compliance Manager

Manage ongoing CDL compliance and medical certificates.

## Inputs

- `screened-candidates`: Hired drivers
- `screening-records`: Screening documentation

## Outputs

- `compliance-tracker`: Status of each driver's compliance items (CDL renewal, medical card, endorsements)
- `expiration-alerts`: Alerts for upcoming expirations

## Process

1. Build the driver qualification file for each driver per FMCSA requirements.
2. Track CDL expiration dates, medical certificate renewals, and endorsement statuses.
3. Set automated alerts for items expiring within 60 days.
4. Conduct annual MVR reviews and document the results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
