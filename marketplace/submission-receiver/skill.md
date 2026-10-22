# Submission Receiver

Receive and log an insurance submission with applicant and broker details.

## Inputs

- `submission-packet`: The application, supplemental forms, and loss runs from the broker or applicant
- `line-of-business`: The insurance line (property, casualty, professional liability, etc.)

## Outputs

- `submission-summary`: Structured summary of the applicant, requested coverage, and key data points
- `missing-information-list`: Items needed from the broker before underwriting can proceed

## Process

1. Extract the applicant name, address, industry, revenue, and employee count from the application.
2. Identify the coverage requested, limits, and effective date.
3. List any missing documents or data fields and flag them for follow-up.
4. Log the submission in the tracking system with a received date and assigned underwriter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
