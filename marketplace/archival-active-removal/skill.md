# Archival Active Removal

Remove the verified archived records from the active system and produce the archival record.

## Inputs

- `removal-authorization`: Confirmation that the archive is verified
- `integrity-results`: Verification results

## Outputs

- `removal-log`: List of records removed from the active system with timestamps
- `archival-record`: Complete archival documentation: criteria, candidates, export, verification, removal, and archive location

## Process

1. Remove the archived records from the active system in batches.
2. Log each removal: record ID, removal timestamp, archive location.
3. Verify the active system record count decreased by the expected amount.
4. Compile the complete archival record for audit purposes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
