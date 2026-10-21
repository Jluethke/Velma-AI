# Filesystem Metadata Analyzer

Analyze filesystem metadata and timestamps for evidence of user and system activity.

## Inputs

- `mounted-filesystem`: The read-only mounted filesystem
- `recovered-files`: Previously recovered deleted files for context

## Outputs

- `metadata-analysis`: Analysis of file creation, modification, and access patterns
- `timeline-entries`: Timestamped entries for the forensic timeline

## Process

1. Extract MACB timestamps from all files and directories
2. Identify timestamp anomalies indicating anti-forensics
3. Analyze file ownership and permission changes
4. Build a chronological activity sequence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
