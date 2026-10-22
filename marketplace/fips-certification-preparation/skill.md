# Fips Certification Preparation

Prepare the cryptographic module for FIPS 140-3 certification: define the cryptographic boundary, document the security policy, implement required self-tests, and prepare for CMVP laboratory testing.

## Inputs

- `asymmetric-implementation`: RSA and ECC implementations
- `constant-time-verification`: Constant-time evidence

## Outputs

- `fips-security-policy`: FIPS 140-3 security policy document: cryptographic boundary, approved algorithms, security levels, roles and services
- `self-test-implementation`: Power-on self-tests (known-answer tests for each algorithm), conditional self-tests (pairwise consistency for key generation), continuous TRNG health tests

## Process

1. Define the cryptographic boundary: the physical or logical perimeter that contains all cryptographic functions. For a software module: the executable and its memory space. For hardware: the physical chip package. All key material, CSPs (Critical Security Parameters), and cryptographic operations must be within the boundary.
2. Document approved algorithms: list every algorithm with its CAVP certificate number. AES (modes: ECB, CBC, CTR, GCM), SHA-2, SHA-3, HMAC, RSA (PKCS#1 v2.1), ECDSA (P-256, P-384), ECDH, DRBG (CTR_DRBG or Hash_DRBG per SP 800-90A). Non-approved algorithms (if present) must be clearly separated and not usable in FIPS mode.
3. Implement power-on self-tests: known-answer test (KAT) for each approved algorithm (encrypt a known plaintext with a known key, compare to expected ciphertext). KATs run at module initialization before any cryptographic service is available. If any KAT fails: enter error state, output no cryptographic results, require power cycle.
4. Conditional self-tests: pairwise consistency test for every asymmetric key generation (generate key pair, sign a message, verify the signature with the public key). Continuous TRNG output test: compare each block of TRNG output with the previous block; identical consecutive blocks indicate TRNG failure.
5. Select FIPS 140-3 security level (1-4). Level 1: basic security, no physical requirements. Level 2: tamper-evident coatings/seals, role-based authentication. Level 3: tamper-responsive circuitry, identity-based authentication. Level 4: envelope protection, environmental failure protection. Most commercial products target Level 1 or 2. Engage a CMVP-accredited laboratory for testing, budget 6-12 months for the evaluation process.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
