# Suspicious File Submitter

Hash and submit suspicious files for deeper analysis and threat intelligence lookup.

## Inputs

- `flagged-files`: Files flagged by scanners
- `suspicious-entries`: Files associated with suspicious persistence

## Outputs

- `submission-results`: Threat intelligence lookup results for each file
- `sample-archive`: Archived copies of suspicious files with hashes

## Process

1. Compute MD5, SHA-1, and SHA-256 hashes for each suspicious file
2. Look up hashes in threat intelligence databases
3. Archive copies of confirmed malicious files in a password-protected container
4. Record file metadata (path, size, timestamps, digital signature status)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
