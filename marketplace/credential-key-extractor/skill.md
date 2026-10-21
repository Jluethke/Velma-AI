# Credential Key Extractor

Recover encryption keys, cached credentials, and authentication tokens from memory.

## Inputs

- `profiled-image`: The memory image for credential extraction
- `process-list`: Processes to target for credential structures

## Outputs

- `extracted-credentials`: Recovered passwords, hashes, tokens, and encryption keys
- `credential-context`: Which processes held each credential and when

## Process

1. Parse LSASS memory for NTLM hashes and Kerberos tickets
2. Search for plaintext passwords in process heaps
3. Extract encryption keys from crypto provider structures
4. Document the context and process for each recovered credential

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
