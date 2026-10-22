# Records Classifier

Classify incoming records according to the retention schedule.

## Inputs

- `retention-schedule`: The approved retention schedule
- `access-matrix`: Access level definitions

## Outputs

- `classified-records`: Records tagged with type, retention period, and access level
- `storage-assignments`: Where each record is stored in the records management system

## Process

1. Match each incoming record to its type in the retention schedule.
2. Tag the record with its retention period and disposition date.
3. Assign the access level from the access matrix.
4. File the record in the designated storage location.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
