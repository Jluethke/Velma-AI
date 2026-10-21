# Crypto Algorithm Standards Check

Check that algorithm and key length choices meet current standards (NIST, OWASP, industry guidelines).

## Inputs

- `crypto-inventory`: Inventory of cryptographic usage
- `scope-definition`: Applicable compliance frameworks

## Outputs

- `standards-findings`: Algorithms and key sizes that fall below current standards
- `deprecation-timeline`: Timeline for when currently acceptable choices become deprecated

## Process

1. Compare each algorithm choice against NIST SP 800-131A and OWASP recommendations
2. Flag deprecated algorithms (MD5, SHA-1, DES, 3DES, RC4, RSA-1024)
3. Check key derivation functions for adequate iteration counts (PBKDF2, bcrypt, Argon2)
4. Identify algorithms approaching end of recommended life

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
