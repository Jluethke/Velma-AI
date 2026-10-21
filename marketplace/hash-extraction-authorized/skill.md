# Hash Extraction Authorized

Extract password hashes from authorized systems using approved access.

## Inputs

- `target-systems`: List of systems to audit
- `authorization-scope`: Written authorization for hash extraction

## Outputs

- `hash-collection`: Extracted password hashes with source metadata
- `hash-type-inventory`: Types and counts of hash algorithms found

## Process

1. Connect to authorized systems: Active Directory, databases, application stores
2. Extract hashes preserving source metadata (system, account type, last change date)
3. Classify hash types: NTLM, bcrypt, SHA-256, MD5, PBKDF2

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
