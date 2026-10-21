# Aws S3 Policy Test

Test S3 bucket policies and ACLs for unauthorized access and data exposure.

## Inputs

- `aws-scope`: S3 buckets in scope
- `escalation-results`: Access levels achieved through escalation

## Outputs

- `s3-findings`: S3 buckets with overly permissive policies or ACLs
- `data-exposure-assessment`: Sensitive data accessible through misconfigured buckets

## Process

1. Enumerate all S3 buckets and their bucket policies
2. Check for public access through ACLs and policy statements
3. Test for cross-account access through misconfigured resource policies
4. Check for unencrypted sensitive data in accessible buckets

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
