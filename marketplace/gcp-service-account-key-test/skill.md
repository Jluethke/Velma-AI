# Gcp Service Account Key Test

Test for leaked or mismanaged service account keys in code, metadata, and configuration stores.

## Inputs

- `service-account-inventory`: Service accounts to investigate
- `project-ids`: Projects to search for key leakage

## Outputs

- `leaked-key-findings`: Discovered service account keys and their locations
- `key-management-issues`: Key rotation and lifecycle management weaknesses

## Process

1. Check for service account keys older than 90 days or never rotated
2. Search Cloud Source Repositories and Cloud Build logs for embedded keys
3. Test for key material in environment variables of Cloud Functions and Cloud Run
4. Attempt to use discovered keys to authenticate and escalate privileges

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
