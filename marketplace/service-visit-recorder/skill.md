# Service Visit Recorder

Record a service visit with date, mileage, services performed, parts used, and technician.

## Inputs

- `vehicle-identifier`: VIN or internal vehicle ID
- `service-details`: What was done, parts used, technician name, date, and mileage

## Outputs

- `service-record`: Formatted service record entry
- `updated-history`: Vehicle history with the new entry appended

## Process

1. Look up the vehicle in the system by VIN or internal ID.
2. Record the visit date, current mileage, services performed, and parts installed.
3. Note the technician who performed the work and any warranty information.
4. Append the record to the vehicle history.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
