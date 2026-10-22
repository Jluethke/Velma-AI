# Secure Boot Chain Design

Implement a secure boot chain with hardware root of trust, cryptographic signature verification, and anti-rollback protection.

## Inputs

- `boot-stage-design`: Boot stages and their responsibilities
- `security-requirements`: Required security level, key management constraints

## Outputs

- `secure-boot-architecture`: Signature algorithm, key storage, verification flow at each stage, failure handling, and anti-rollback counter mechanism
- `key-management-plan`: Root key generation, signing key hierarchy, key storage (OTP fuses or secure element), and key revocation procedure

## Process

1. Select the signature algorithm. ECDSA with P-256 is the standard choice: 64-byte signature, verification in under 100 ms on a Cortex-M4 at 168 MHz. RSA-2048 is an alternative but signatures are 256 bytes and verification is slower without hardware acceleration.
2. Store the root public key in one-time-programmable (OTP) fuses or a secure element. This is the hardware root of trust. The ROM bootloader or first-stage bootloader uses this key to verify the next stage. Once burned, the key cannot be changed, so key generation must follow a ceremony with offline storage of the private key.
3. Implement the chain of trust: ROM verifies stage 1 using the OTP root key. Stage 1 verifies stage 2 using a key embedded in stage 1 (or the same root key). Stage 2 verifies the application. Each stage only executes the next if verification passes.
4. Add a firmware image header before each signed blob: magic number, version number, image size, hardware compatibility ID, signature. The verifier reads the header, hashes the image (SHA-256), then checks the signature against the hash.
5. Implement anti-rollback: store a monotonic counter in OTP fuses or a protected NVM region. Each firmware image header contains a minimum-version field. The bootloader refuses to boot any image with a version lower than the stored counter. After successful boot, update the counter to the running version.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
