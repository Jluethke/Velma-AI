# Gcp Metadata Server Test

Test for metadata server access from GCE instances to extract service account tokens and project metadata.

## Inputs

- `iam-binding-map`: IAM bindings to identify compute resources
- `leaked-key-findings`: Keys that may provide compute access

## Outputs

- `metadata-access-results`: Results of metadata endpoint queries from instances
- `extracted-tokens`: Service account tokens obtained from metadata server

## Process

1. Identify all GCE instances and their attached service accounts
2. Test metadata endpoint access (v1/computeMetadata) from accessible instances
3. Extract access tokens and project-level metadata attributes
4. Check for custom metadata containing secrets or configuration data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
