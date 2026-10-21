# Crypto Key Management Review

Review the key management lifecycle including generation, storage, distribution, rotation, and destruction.

## Inputs

- `crypto-inventory`: Inventory of cryptographic usage and keys
- `crypto-dependency-list`: Cryptographic library versions

## Outputs

- `key-management-findings`: Weaknesses in key lifecycle management
- `key-storage-assessment`: Assessment of how and where cryptographic keys are stored

## Process

1. Check key generation for proper random number source usage
2. Review key storage (HSM, KMS, encrypted files, environment variables, hardcoded)
3. Check key rotation schedules and procedures
4. Verify key destruction procedures (zeroization, secure deletion)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
