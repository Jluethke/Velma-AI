# Crypto Implementation Flaw Test

Test for common cryptographic implementation errors including padding oracle, timing attacks, and weak randomness.

## Inputs

- `crypto-inventory`: Inventory of cryptographic usage
- `key-management-findings`: Key management findings for context

## Outputs

- `implementation-flaws`: Specific implementation errors found in cryptographic code
- `exploit-feasibility`: Assessment of whether each flaw is practically exploitable

## Process

1. Test CBC-mode implementations for padding oracle vulnerabilities
2. Measure timing differences in comparison operations (MAC verification, password checking)
3. Check random number generator seeding and usage patterns
4. Test for nonce reuse in authenticated encryption (GCM, ChaCha20-Poly1305)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
