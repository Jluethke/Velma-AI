# Permit Application Receiver

Receive and log an incoming permit application.

## Inputs

- `application-documents`: The submitted permit application and supporting documents
- `permit-type`: The type of permit being requested (building, zoning, special use, etc.)

## Outputs

- `application-record`: Logged application with tracking number and timestamp
- `completeness-checklist`: Checklist of required documents and their submission status

## Process

1. Assign a tracking number and log the application in the permit system.
2. Check all submitted documents against the required document list for the permit type.
3. Note any missing or incomplete items on the completeness checklist.
4. Notify the applicant of any deficiencies within the required timeframe.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
