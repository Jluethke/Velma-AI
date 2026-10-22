# Matter Close Archiver

Close the matter file and archive all records per the retention schedule.

## Inputs

- `resolution-record`: The resolution record
- `document-index`: Complete document index

## Outputs

- `closed-matter-record`: The final matter record marked as closed with archive location
- `retention-schedule`: Retention period and destruction date for the matter file

## Process

1. Verify all documents are filed, all time entries billed, and all obligations recorded.
2. Apply the retention schedule based on matter type and jurisdiction.
3. Archive the matter file to the designated storage with the retention metadata.
4. Produce the final closed matter record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
