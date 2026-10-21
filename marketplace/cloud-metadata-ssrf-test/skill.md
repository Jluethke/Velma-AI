# Cloud Metadata Ssrf Test

Test for server-side request forgery to cloud metadata endpoints (169.254.169.254, Azure IMDS, GCP metadata).

## Inputs

- `application-endpoints`: URLs of application endpoints that accept user input
- `cluster-access`: Cluster access for IMDSv2 and metadata configuration checks

## Outputs

- `ssrf-findings`: SSRF vulnerabilities reaching cloud metadata
- `metadata-exposure-risk`: Credentials and data reachable through metadata SSRF

## Process

1. Test all user-controlled URL, file, or redirect parameters for SSRF to metadata endpoints
2. Check whether IMDSv2 (AWS), managed identity restrictions (Azure), or metadata concealment (GCP) is enforced
3. Attempt to retrieve IAM credentials and cloud provider tokens through any SSRF found
4. Test DNS rebinding and IP obfuscation bypass techniques

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
