# Ssrf Cloud Metadata Test

Test for SSRF access to cloud metadata endpoints (AWS, Azure, GCP).

## Inputs

- `ssrf-surface-map`: SSRF-capable endpoints
- `internal-scan-results`: Basic SSRF results confirming exploitability

## Outputs

- `metadata-access-results`: Cloud metadata endpoints reachable through SSRF
- `credential-exposure`: Any IAM credentials or tokens exposed through metadata

## Process

1. Test AWS metadata at 169.254.169.254/latest/meta-data/ and IMDSv2 token endpoint
2. Test Azure metadata at 169.254.169.254/metadata/instance with required header
3. Test GCP metadata at metadata.google.internal/computeMetadata/v1/
4. Check for exposed IAM role credentials, access tokens, and instance identity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
