# Auth Decision Communication

Communicate the authorization decision to the patient and scheduling team, and handle denials.

## Inputs

- `auth-status`: Authorization decision from the payer
- `auth-tracking-number`: Payer reference number

## Outputs

- `authorization-record`: Complete authorization record with decision, dates, and any appeal outcome
- `scheduling-clearance`: Clearance for scheduling (approved) or hold notice (denied/pending appeal)

## Process

1. If approved, record the authorization number, approved services, and validity dates.
2. Notify the scheduling team to proceed with booking.
3. If denied, review the denial reason and decide whether to appeal or pursue alternatives.
4. Communicate the outcome to the patient, including any financial implications.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
