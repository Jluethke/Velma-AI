# Rfi Intake Logger

Receive and log a request for information from the field.

## Inputs

- `rfi-subject`: Subject of the RFI
- `rfi-description`: Detailed question or request
- `originator`: Name and company of the person submitting the RFI

## Outputs

- `rfi-record`: Logged RFI with number, date, and subject
- `rfi-number`: Assigned RFI tracking number

## Process

1. Assign the next sequential RFI number.
2. Log the RFI with date, originator, subject, and description.
3. Attach any supporting drawings or photos.
4. Classify the urgency (routine, urgent, critical).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
