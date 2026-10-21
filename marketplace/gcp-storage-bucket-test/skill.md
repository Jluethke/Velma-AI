# Gcp Storage Bucket Test

Test GCS bucket permissions for public access, overly broad IAM, and ACL misconfigurations.

## Inputs

- `project-ids`: Projects containing storage buckets
- `extracted-tokens`: Tokens to test bucket access

## Outputs

- `bucket-exposure-findings`: Public or misconfigured bucket access findings
- `data-access-evidence`: Evidence of unauthorized data access

## Process

1. Enumerate all GCS buckets and their IAM policies and ACLs
2. Test for publicly accessible buckets and objects
3. Check for allUsers and allAuthenticatedUsers bindings
4. Attempt data access using compromised tokens and service account keys

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
