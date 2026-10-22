# Archival Integrity Verifier

Verify the archive by comparing record counts, checksums, and spot-checking data.

## Inputs

- `archive-location`: Where the archived data is stored
- `export-manifest`: List of exported records with checksums

## Outputs

- `integrity-results`: Verification results: record count match, checksum match, spot-check pass/fail
- `removal-authorization`: Confirmation that the archive is verified and records can be removed from the active system

## Process

1. Compare the archive record count to the export manifest count.
2. Verify checksums match between the export and the archive.
3. Spot-check a random sample of archived records against the active system originals.
4. If all checks pass, authorize removal from the active system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
