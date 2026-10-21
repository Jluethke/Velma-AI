# Disk Hash Verifier

Verify the integrity of a disk image by computing and comparing cryptographic hashes.

## Inputs

- `disk-image`: The forensic image file to verify
- `acquisition-log`: Log containing the original hash values

## Outputs

- `verified-image`: The image confirmed as matching the original hash
- `hash-report`: Report of all hash computations and comparison results

## Process

1. Compute MD5 and SHA-256 hashes of the image
2. Compare against the hashes recorded during acquisition
3. Document any mismatches or verification failures
4. Record the verification timestamp and tool versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
