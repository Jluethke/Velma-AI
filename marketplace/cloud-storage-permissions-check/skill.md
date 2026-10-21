# Cloud Storage Permissions Check

Check permissions on cloud storage resources (S3 buckets, blob containers, GCS buckets) for public access and overly broad sharing.

## Inputs

- `resource-inventory`: Inventory of storage resources
- `network-findings`: Network exposure context

## Outputs

- `storage-findings`: Storage misconfigurations and public exposure issues
- `sensitive-data-exposure`: Storage resources with sensitive data that are publicly accessible

## Process

1. Check each storage resource for public access configurations.
2. Verify bucket policies and ACLs enforce least-privilege access.
3. Scan for sensitive file patterns (credentials, backups, PII) in public storage.
4. Check that server-side encryption is enabled for all storage resources.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
